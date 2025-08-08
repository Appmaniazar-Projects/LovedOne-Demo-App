import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Routes, Route, useParams, Outlet, Navigate, useNavigate } from 'react-router-dom';
import AuthRedirect from './components/Auth/AuthRedirect';
import LoginPage from './components/Auth/LoginPage';
import ParlorSelector from './components/Parlor/ParlorSelector';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import Clients from './components/Clients/Clients';
import Cases from './components/Cases/Cases';
import Payments from './components/Payments/Payments';
import TaskBoard from './components/Tasks/TaskBoard';
import ProfilePage from './components/Profile/ProfilePage';
import SettingsPage from './components/Settings/SettingsPage';

// The layout for a specific parlor, including sidebar, header, and content
const ParlorLayout = () => {
  const { parlorSlug } = useParams<{ parlorSlug: string }>();
  const [parlorName, setParlorName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParlorInfo = async () => {
      if (!parlorSlug) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('parlors')
        .select('name')
        .eq('slug', parlorSlug)
        .single();

      if (error) {
        console.error('Error fetching parlor info:', error);
      } else {
        setParlorName(data.name);
      }
      setLoading(false);
    };

    fetchParlorInfo();
  }, [parlorSlug]);

  if (loading) {
    return <div>Loading parlor...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar parlorSlug={parlorSlug!} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header parlorName={parlorName} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};



const RoleBasedRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const getUserProfileAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, parlor_id')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        await supabase.auth.signOut();
        return;
      }

      if (profile.role === 'super_admin') {
        navigate('/select-parlor');
      } else if (profile.parlor_id) {
        const { data: parlor, error: parlorError } = await supabase
          .from('parlors')
          .select('slug')
          .eq('id', profile.parlor_id)
          .single();

        if (parlorError) {
          console.error('Error fetching parlor slug:', parlorError);
          await supabase.auth.signOut();
        } else {
          navigate(`/${parlor.slug}/dashboard`);
        }
      } else {
        console.error('User has no role or assigned parlor.');
        await supabase.auth.signOut();
      }
    };

    getUserProfileAndRedirect();
  }, [navigate]);

  return <div>Loading...</div>;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading application...</div>; // Initial app load
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthRedirect />} />
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/select-parlor" element={<ParlorSelector />} />
      <Route path="/:parlorSlug" element={<ParlorLayout />}>
        {/* Redirect from /:parlorSlug to /:parlorSlug/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="cases" element={<Cases />} />
        <Route path="payments" element={<Payments />} />
                <Route path="tasks" element={<TaskBoard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Add other nested routes here */}
      </Route>
    </Routes>
  );
}

export default App;