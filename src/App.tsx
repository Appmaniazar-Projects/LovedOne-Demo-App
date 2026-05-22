import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Routes, Route, useParams, Outlet, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthRedirect from './components/Auth/AuthRedirect';
import ParlorSelector from './components/Parlor/ParlorSelector';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import Clients from './components/Clients/Clients';
import CasesBoard from './components/Cases/CasesBoard';
import Payments from './components/Payments/Payments';
import Services from './components/Services/Services';
import Reports from './components/Reports/Reports';
import Notifications from './components/Notifications/Notifications';
import ProfilePage from './components/Profile/ProfilePage';
import SettingsPage from './components/Settings/SettingsPage';
import ParlorDetails from './components/Parlor/ParlorDetails';
import ClientDetails from './components/Clients/ClientDetails';
import PaymentAlertDashboard from './components/Payments/PaymentAlertDashboard';

const SESSION_MAX_AGE_MS = 72 * 60 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// The layout for a specific parlor, including sidebar, header, and content
const ParlorLayout = () => {
  const { parlorId: parlorKey } = useParams<{ parlorId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [parlorNameState, setParlorName] = useState<string>('');
  const [resolvedParlorId, setResolvedParlorId] = useState<string>('');
  const [parlorRouteKey, setParlorRouteKey] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchParlorDetails = async () => {
      if (!parlorKey) return;

      const isUuid = UUID_RE.test(parlorKey);

      let parlorRes: { data: any; error: any };

      if (isUuid) {
        parlorRes = await supabase
          .from('parlors')
          .select('id, name, slug')
          .eq('id', parlorKey)
          .single();
      } else {
        parlorRes = await supabase
          .from('parlors')
          .select('id, name, slug')
          .eq('slug', parlorKey)
          .single();

        if (parlorRes.error) {
          parlorRes = await supabase
            .from('parlors')
            .select('id, name, slug')
            .ilike('name', parlorKey)
            .single();
        }
      }

      const parlor = parlorRes.data;

      if (!parlorRes.error && parlor?.id && parlor?.name) {
        setParlorName(parlor.name);
        setResolvedParlorId(parlor.id);

        const nextRouteKey = parlor.slug || parlorKey;
        setParlorRouteKey(nextRouteKey);

        if (isUuid && parlor.slug) {
          const prefixRe = new RegExp(`^/${parlorKey}(?=/|$)`);
          if (prefixRe.test(location.pathname)) {
            navigate(`${location.pathname.replace(prefixRe, `/${parlor.slug}`)}${location.search}${location.hash}`, { replace: true });
          }
        }
      } else {
        setParlorName('');
        setResolvedParlorId('');
        setParlorRouteKey(parlorKey);
      }
    };
    
    fetchParlorDetails();
  }, [location.hash, location.pathname, location.search, navigate, parlorKey]);

  // Don't render until we have the parlor details
  if (!resolvedParlorId || !parlorNameState) {
    return <div className="flex items-center justify-center h-screen">Loading parlor...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <Sidebar 
            parlorId={parlorRouteKey || resolvedParlorId} 
            parlorName={parlorNameState} 
            isMobile={isMobile}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
        
        <div className="flex-1 flex flex-col h-full overflow-hidden lg:ml-0">
          <Header 
            parlorName={parlorNameState} 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex-1 overflow-auto bg-white dark:bg-gray-900 p-4 sm:p-6">
            <Outlet context={{ parlorId: resolvedParlorId, parlorRouteKey: parlorRouteKey || resolvedParlorId, parlorName: parlorNameState }} />
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

      const navigateToParlorDashboard = async (id: string) => {
        const { data: parlor } = await supabase
          .from('parlors')
          .select('slug')
          .eq('id', id)
          .single();

        const routeKey = parlor?.slug || id;
        navigate(`/${routeKey}/dashboard`, { replace: true });
      };

      if (profile.role === 'super_admin') {
        const { data: parlors, error: parlorsError } = await supabase
          .from('parlors')
          .select('id')
          .limit(1);

        if (parlorsError || !parlors || parlors.length === 0) {
          console.error('Error fetching default parlor for super_admin:', parlorsError);
          await supabase.auth.signOut();
          return;
        }

        await navigateToParlorDashboard(parlors[0].id);
      } else if (profile.parlor_id) {
        await navigateToParlorDashboard(profile.parlor_id);
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN') {
        const now = Date.now();
        localStorage.setItem('customSessionStartedAt', now.toString());
      }

      if (currentSession) {
        const now = Date.now();
        const stored = localStorage.getItem('customSessionStartedAt');
        const startedAt = stored ? parseInt(stored, 10) : now;

        if (!stored) {
          localStorage.setItem('customSessionStartedAt', startedAt.toString());
        }

        if (now - startedAt > SESSION_MAX_AGE_MS) {
          await supabase.auth.signOut();
          localStorage.removeItem('customSessionStartedAt');
          setLoading(false);
          navigate('/login', { replace: true });
          return;
        }
      } else {
        localStorage.removeItem('customSessionStartedAt');
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (currentSession) {
        const now = Date.now();
        const stored = localStorage.getItem('customSessionStartedAt');
        let startedAt = stored ? parseInt(stored, 10) : now;

        if (!stored) {
          localStorage.setItem('customSessionStartedAt', startedAt.toString());
        }

        if (now - startedAt > SESSION_MAX_AGE_MS) {
          await supabase.auth.signOut();
          localStorage.removeItem('customSessionStartedAt');
          setLoading(false);
          navigate('/login', { replace: true });
          return;
        }
      } else {
        localStorage.removeItem('customSessionStartedAt');
      }

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
  }, [navigate]);

  if (loading) {
    return <div>Loading application...</div>;
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
      <Route path="/parlors/:id" element={<ParlorDetails />} />
      <Route path=":parlorId" element={<ParlorLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:clientSlug" element={<ClientDetails />} />
        <Route path="cases" element={<CasesBoard />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payment-alerts" element={<PaymentAlertDashboard />} />
        <Route path="services" element={<Services />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;