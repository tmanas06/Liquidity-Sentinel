import { useCallback, useEffect, useMemo, useState } from 'react';
import App from './App.jsx';
import LandingPage from './pages/LandingPage.jsx';

const TAB_TO_PATH = {
  hub: '/app',
  trust: '/app/agents',
  billing: '/app/payments',
  gov: '/app/admin',
  ai: '/app/copilot',
};

function tabFromPath(pathname) {
  if (pathname.startsWith('/app/agents')) return 'trust';
  if (pathname.startsWith('/app/payments')) return 'billing';
  if (pathname.startsWith('/app/admin')) return 'gov';
  if (pathname.startsWith('/app/copilot')) return 'ai';
  return 'hub';
}

export default function RootApp() {
  const [location, setLocation] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));

  useEffect(() => {
    const handlePopState = () => setLocation({
      pathname: window.location.pathname,
      search: window.location.search,
    });
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to) => {
    window.history.pushState({}, '', to);
    setLocation({ pathname: window.location.pathname, search: window.location.search });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeTab = useMemo(() => tabFromPath(location.pathname), [location.pathname]);

  if (!location.pathname.startsWith('/app')) {
    return <LandingPage onNavigate={navigate} />;
  }

  return (
    <App
      initialTab={activeTab}
      isGuidedEntry={location.pathname.startsWith('/app/get-started')}
      onNavigate={(tab) => navigate(TAB_TO_PATH[tab] || '/app')}
      onExit={() => navigate('/')}
    />
  );
}
