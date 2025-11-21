import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Routes, Route, useParams, Outlet, Navigate, useNavigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import Services from './components/Services/Services';
import Reports from './components/Reports/Reports';
import Notifications from './components/Notifications/Notifications';
import ProfilePage from './components/Profile/ProfilePage';
import SettingsPage from './components/Settings/SettingsPage';
import ParlorDetails from './components/Parlor/ParlorDetails';
import ClientDetails from './components/Clients/ClientDetails';

// The layout for a specific parlor, including sidebar, header, and content
const ParlorLayout = () => {
  const { parlorId } = useParams<{ parlorId: string }>();
  const [parlorNameState, setParlorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchParlorName = async () => {
      if (parlorId) {
        try {
          const { data: parlorData, error } = await supabase
            .from('parlors')
            .select('name')
            .eq('id', parlorId)
            .single();
          
          if (error) {
            console.error('Error fetching parlor name:', error);
            setParlorName('Unknown Parlor');
          } else if (parlorData) {
            setParlorName(parlorData.name);
          }
        } catch (err) {
          console.error('Failed to fetch parlor:', err);
          setParlorName('Unknown Parlor');
        }
      }
      setLoading(false);
    };

    fetchParlorName();
  }, [parlorId]);

  if (loading) {
    return <div>Loading parlor...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar parlorName={parlorNameState} />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header parlorName={parlorNameState} />
          <main className="flex-1 overflow-auto bg-white dark:bg-gray-900 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster position="top-right" />
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
          .select('name')
          .eq('id', profile.parlor_id)
          .single();

        if (parlorError) {
          console.error('Error fetching parlor name:', parlorError);
          await supabase.auth.signOut();
        } else {
          navigate(`/${encodeURIComponent(parlor.name)}/dashboard`);
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

    // Set initial theme class on body
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading application...</div>; // Initial app load
  }

  return (
    <Routes>
      <Route path="/test-route" element={
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Test Route</h1>
          <p>This is a test route to check if routing is working.</p>
          <Link to="/parlors/123" className="text-blue-600 hover:underline">
            Test Parlor Details
          </Link>
        </div>
      } />
      {/* Login and role-based redirect routes are kept but no longer block rendering when there is no session */}
      <Route path="/login" element={<AuthRedirect />} />
      {/* For development, redirect root directly to a demo parlor dashboard without requiring login */}
      <Route path="/" element={<Navigate to="/demo-parlor/dashboard" replace />} />
      <Route path="/select-parlor" element={<ParlorSelector />} />
      <Route path="/parlors/:id" element={<ParlorDetails />} />
      <Route path="/:parlorName" element={<ParlorLayout />}>
        {/* Redirect from /:parlorSlug to /:parlorSlug/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="cases" element={<Cases />} />
        <Route path="payments" element={<Payments />} />
        <Route path="tasks" element={<TaskBoard />} />
        {/* Documents page removed; documents managed under Clients */}
        <Route path="services" element={<Services />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Add other nested routes here */}
      </Route>
    </Routes>
  );
}

export default App;