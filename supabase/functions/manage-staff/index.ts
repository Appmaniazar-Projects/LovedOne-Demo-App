// manage-staff: lets a parlour admin (or a super admin) manage the people
// who can use their parlour. Runs with the service role because creating
// logins and sending invites needs Supabase's admin API — so every action
// first checks that the CALLER may manage the parlour in question.
//
// Actions (POST JSON):
//   { action: 'list',     parlorId }
//   { action: 'invite',   parlorId, email, fullName, role: 'staff' | 'admin', redirectTo? }
//   { action: 'set_role', parlorId, userId, role: 'staff' | 'admin' }
//   { action: 'remove',   parlorId, userId }

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const ASSIGNABLE_ROLES = ['staff', 'admin'] as const;
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];
const isAssignable = (r: unknown): r is AssignableRole => typeof r === 'string' && (ASSIGNABLE_ROLES as readonly string[]).includes(r);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function isMember(admin: SupabaseClient, userId: string, parlorId: string) {
  const { data } = await admin
    .from('user_parlors')
    .select('user_id')
    .eq('user_id', userId)
    .eq('parlor_id', parlorId)
    .maybeSingle();
  return !!data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authentication required' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !serviceRoleKey || !anonKey) throw new Error('Supabase environment is not configured');

    // Who is calling?
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Invalid authentication' }, 401);
    const callerId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const body = await req.json().catch(() => ({}));
    const { action, parlorId } = body as { action?: string; parlorId?: string };
    if (typeof parlorId !== 'string' || !parlorId) return json({ error: 'parlorId is required' }, 400);

    // May the caller manage this parlour? super_admin: any parlour.
    // admin: only parlours they belong to. Everyone else: no.
    const { data: caller } = await admin.from('users').select('role').eq('id', callerId).maybeSingle();
    const callerIsSuper = caller?.role === 'super_admin';
    const callerCanManage = callerIsSuper || (caller?.role === 'admin' && (await isMember(admin, callerId, parlorId)));
    if (!callerCanManage) return json({ error: 'Only this parlour\'s admins can manage its team' }, 403);

    // ── list ────────────────────────────────────────────────────────────
    if (action === 'list') {
      const { data: links, error } = await admin.from('user_parlors').select('user_id').eq('parlor_id', parlorId);
      if (error) throw error;
      const ids = (links || []).map((l) => l.user_id);
      if (ids.length === 0) return json({ members: [] });

      const { data: people, error: peopleError } = await admin
        .from('users')
        .select('id, email, full_name, role, created_at')
        .in('id', ids);
      if (peopleError) throw peopleError;

      // Has each person finished accepting their invite?
      const members = await Promise.all(
        (people || []).map(async (p) => {
          const { data: authUser } = await admin.auth.admin.getUserById(p.id);
          const u = authUser?.user;
          return {
            ...p,
            pending: !!u && !u.last_sign_in_at,
            last_sign_in_at: u?.last_sign_in_at ?? null,
            is_self: p.id === callerId,
          };
        }),
      );
      members.sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''));
      return json({ members });
    }

    // ── invite ──────────────────────────────────────────────────────────
    if (action === 'invite') {
      const email = String(body.email || '').trim().toLowerCase();
      const fullName = String(body.fullName || '').trim();
      const role = body.role;
      if (!EMAIL_RE.test(email)) return json({ error: 'Enter a valid email address' }, 400);
      if (!fullName) return json({ error: 'Full name is required' }, 400);
      if (!isAssignable(role)) return json({ error: 'Role must be staff or admin' }, 400);

      // Already has a LovedOne login? Then just give them access to this parlour.
      const { data: existing } = await admin.from('users').select('id, role, parlor_id, full_name').ilike('email', email).maybeSingle();

      let userId: string;
      let invited = false;
      if (existing) {
        userId = existing.id;
        if (await isMember(admin, userId, parlorId)) {
          return json({ error: 'This person is already on this parlour\'s team' }, 409);
        }
        // Never change a super admin, and never downgrade an existing admin
        // just because another parlour invited them as staff.
        const patch: Record<string, unknown> = {};
        if (existing.role !== 'super_admin') {
          if (existing.role === 'viewer' || !existing.role || (existing.role === 'staff' && role === 'admin')) patch.role = role;
        }
        if (!existing.parlor_id) patch.parlor_id = parlorId;
        if (!existing.full_name) patch.full_name = fullName;
        if (Object.keys(patch).length) {
          const { error } = await admin.from('users').update(patch).eq('id', userId);
          if (error) throw error;
        }
      } else {
        const redirectTo = typeof body.redirectTo === 'string' ? body.redirectTo : undefined;
        const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName },
          redirectTo,
        });
        if (inviteError || !inviteData.user) {
          console.error('Invite failed:', inviteError);
          return json({ error: inviteError?.message || 'Could not send the invite' }, 400);
        }
        userId = inviteData.user.id;
        invited = true;

        // The signup trigger creates the users row as 'viewer'; set it up.
        const { error: upsertError } = await admin
          .from('users')
          .upsert({ id: userId, email, full_name: fullName, role, parlor_id: parlorId }, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }

      const { error: linkError } = await admin.from('user_parlors').insert({ user_id: userId, parlor_id: parlorId });
      if (linkError) throw linkError;

      return json({ ok: true, userId, invited });
    }

    // ── set_role / remove: the target must be on this parlour ───────────
    const targetId = body.userId;
    if (typeof targetId !== 'string' || !targetId) return json({ error: 'userId is required' }, 400);
    if (targetId === callerId) return json({ error: 'You can\'t change your own access. Ask another admin.' }, 400);
    if (!(await isMember(admin, targetId, parlorId))) return json({ error: 'That person is not on this parlour\'s team' }, 404);

    const { data: target } = await admin.from('users').select('id, role, parlor_id').eq('id', targetId).maybeSingle();
    if (!target) return json({ error: 'User not found' }, 404);
    if (target.role === 'super_admin') return json({ error: 'LovedOne super admins can\'t be changed here' }, 403);

    if (action === 'set_role') {
      if (!isAssignable(body.role)) return json({ error: 'Role must be staff or admin' }, 400);
      const { error } = await admin.from('users').update({ role: body.role }).eq('id', targetId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === 'remove') {
      const { error } = await admin.from('user_parlors').delete().eq('user_id', targetId).eq('parlor_id', parlorId);
      if (error) throw error;

      // If this was their main parlour, move them to another one they still
      // belong to; with none left, they lose access entirely (role viewer).
      if (target.parlor_id === parlorId) {
        const { data: remaining } = await admin.from('user_parlors').select('parlor_id').eq('user_id', targetId).limit(1);
        const next = remaining?.[0]?.parlor_id ?? null;
        const patch: Record<string, unknown> = { parlor_id: next };
        if (!next) patch.role = 'viewer';
        const { error: patchError } = await admin.from('users').update(patch).eq('id', targetId);
        if (patchError) throw patchError;
      }
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    console.error('manage-staff error:', err);
    return json({ error: 'Unexpected error managing the team' }, 500);
  }
});
