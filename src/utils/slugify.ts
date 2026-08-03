/**
 * Convert client name to URL-safe slug
 * Uses only the name, no ID in the slug
 */
export const slugify = (name: string): string => {
  // Convert to lowercase and replace spaces with hyphens
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove hyphens from start/end

  // If slug is empty or too short, use a default
  if (slug.length < 2) {
    slug = 'client';
  }

  return slug;
};

/**
 * Find client by slug (name-based lookup)
 * This will need to be used in the component to query the database
 */
export const getClientBySlug = async (slug: string, supabase: any, parlorId?: string) => {
  console.log('Looking up client with slug:', slug, 'parlorId:', parlorId);
  
  // Convert slug back to a more readable name format for searching
  const nameFromSlug = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  console.log('Converted slug to name:', nameFromSlug);

  const exactQuery = supabase
    .from('clients')
    .select('*')
    .ilike('name', nameFromSlug)
    .single();

  if (parlorId) {
    exactQuery.eq('parlor_id', parlorId);
  }

  const { data: exactMatch, error: exactError } = await exactQuery;
  console.log('Exact match result:', exactMatch, exactError);

  if (exactMatch && !exactError) {
    return exactMatch;
  }

  // If no exact match, try a broader search
  const searchQuery = supabase
    .from('clients')
    .select('*')
    .ilike('name', `%${nameFromSlug}%`)
    .limit(5);

  if (parlorId) {
    searchQuery.eq('parlor_id', parlorId);
  }

  const { data: clients, error: searchError } = await searchQuery;
  console.log('Search result:', clients, searchError);

  if (searchError) {
    throw searchError;
  }

  if (clients && clients.length > 0) {
    return clients[0];
  }

  // Fallback: try to find a client by checking if slug matches any part of the name
  const allClientsQuery = supabase
    .from('clients')
    .select('*')
    .limit(20);

  if (parlorId) {
    allClientsQuery.eq('parlor_id', parlorId);
  }

  const { data: allClients, error: allClientsError } = await allClientsQuery;
  console.log('All clients fallback:', allClients, allClientsError);

  if (allClientsError) {
    throw allClientsError;
  }

  const slugLower = slug.toLowerCase();
  const matchedClient = allClients?.find((client: any) => 
    client.name.toLowerCase().includes(slugLower) ||
    slugify(client.name) === slugLower
  );

  console.log('Matched client:', matchedClient);

  return matchedClient || null;
};
