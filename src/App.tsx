import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Routes, Route, useParams, Outlet, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './components/Auth/LoginPage';
import ParlorSelector from './components/Parlor/ParlorSelector';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import Clients from './components/Clients/Clients';
import Cases from './components/Cases/Cases';
import Payments from './components/Payments/Payments';
import TaskBoard from './components/Tasks/TaskBoard';

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

// A component to handle the initial redirection based on user role
const RoleBasedRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const getUserProfileAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return; // Should be handled by the main App component
      }

      // Fetch user profile from your 'users' table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, parlor_id')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Handle error, maybe show a generic error page or sign out
        await supabase.auth.signOut();
        return;
      }

      if (profile.role === 'super_admin') {
        // Super admins go to the parlor selector
        navigate('/select-parlor');
      } else if (profile.parlor_id) {
        // Other users go to their assigned parlor's dashboard
        const { data: parlor, error: parlorError } = await supabase
          .from('parlors')
          .select('slug')
          .eq('id', profile.parlor_id)
          .single();
        
        if (parlorError) {
          console.error('Error fetching parlor slug:', parlorError);
          // Handle error
          await supabase.auth.signOut();
        } else {
          navigate(`/${parlor.slug}/dashboard`);
        }
      } else {
        // User has no role or parlor, sign them out
        console.error('User has no role or assigned parlor.');
        await supabase.auth.signOut();
      }
    };

    getUserProfileAndRedirect();
  }, [navigate]);

  return <div>Loading...</div>; // Show a loading indicator while we redirect
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Initial check
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
        {/* Add other nested routes here */}
      </Route>
    </Routes>
  );
}

export default App;