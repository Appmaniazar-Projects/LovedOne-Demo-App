import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Routes, Route, useParams, Outlet, Navigate, useNavigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
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
import Documents from './components/Documents/Documents';
import Services from './components/Services/Services';
import Reports from './components/Reports/Reports';
import Notifications from './components/Notifications/Notifications';
import ProfilePage from './components/Profile/ProfilePage';
import SettingsPage from './components/Settings/SettingsPage';
import ParlorDetails from './components/Parlor/ParlorDetails';
import ClientDetails from './components/Clients/ClientDetails';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <Sidebar parlorSlug={parlorSlug!} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header parlorName={parlorName} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 p-6">
            <Outlet />
          </main>
        </div>
        <Toaster position="top-right" />
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

    // Set initial theme class on body
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => subscription.unsubscribe();
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
      <Route path="/test-route" element={
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Test Route</h1>
          <p>This is a test route to check if routing is working.</p>
          <Link to="/parlors/123" className="text-blue-600 hover:underline">
            Test Parlor Details
          </Link>
        </div>
      } />
      <Route path="/login" element={<AuthRedirect />} />
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/select-parlor" element={<ParlorSelector />} />
      <Route path="/clients/:id" element={<ClientDetails />} />
      <Route path="/parlors/:id" element={<ParlorDetails />} />
      <Route path="/:parlorSlug" element={<ParlorLayout />}>
        {/* Redirect from /:parlorSlug to /:parlorSlug/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="cases" element={<Cases />} />
        <Route path="payments" element={<Payments />} />
        <Route path="tasks" element={<TaskBoard />} />
        <Route path="documents" element={<Documents />} />
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