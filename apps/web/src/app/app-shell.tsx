import { AppHeader } from '../components/app-header.js';
import { openDeveloperHome, openPmDashboard, openPmSession, useAppRoute } from '../hooks/use-app-route.js';
import { clearAuthSession, setAuthSession, useAuthSession } from '../hooks/use-auth-session.js';
import { DeveloperHomePage } from '../views/developer-home-page.js';
import { LoginPage } from '../views/login-page.js';
import { PmDashboardPage } from '../views/pm-dashboard-page.js';
import { PmSessionPage } from '../views/pm-session-page.js';

export function AppShell() {
  const authSession = useAuthSession();
  const route = useAppRoute();

  if (!authSession) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <LoginPage
          onAuthenticated={(session) => {
            setAuthSession(session);
            if (session.user.kind === 'pm') {
              openPmDashboard();
              return;
            }
            openDeveloperHome();
          }}
        />
      </main>
    );
  }

  const currentViewLabel =
    authSession.user.kind === 'pm' && route.kind === 'pm-session'
      ? 'PM session workspace'
      : authSession.user.kind === 'pm'
        ? 'PM shared-project dashboard'
        : 'Developer local access';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader
        currentViewLabel={currentViewLabel}
        onSignOut={() => {
          clearAuthSession();
        }}
        user={authSession.user}
      />
      {authSession.user.kind === 'pm' ? (
        route.kind === 'pm-session' ? (
          <PmSessionPage accessToken={authSession.accessToken} onBack={openPmDashboard} sessionId={route.sessionId} />
        ) : (
          <PmDashboardPage
            accessToken={authSession.accessToken}
            onOpenSession={(sessionId) => openPmSession(sessionId)}
          />
        )
      ) : (
        <DeveloperHomePage session={authSession} />
      )}
    </main>
  );
}
