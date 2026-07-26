import { openDeveloperHome, openPmDashboard, openPmSession, useAppRoute } from '../hooks/use-app-route.js';
import { clearAuthSession, setAuthSession, useAuthSession } from '../hooks/use-auth-session.js';
import { DeveloperHomePage } from '../views/developer-home-page.js';
import { LoginPage } from '../views/login-page.js';
import { PmActivityPage } from '../views/pm-activity-page.js';
import { PmDashboardPage } from '../views/pm-dashboard-page.js';
import { PmSessionPage } from '../views/pm-session-page.js';

export function AppShell() {
  const authSession = useAuthSession();
  const route = useAppRoute();

  if (!authSession) {
    return (
      <main className="min-h-dvh text-[#eef0f4]">
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

  const isFullscreenSession =
    (authSession.user.kind === 'pm' && route.kind === 'pm-session') ||
    (authSession.user.kind === 'developer' && route.kind === 'developer-session');

  return (
    <main className={isFullscreenSession ? 'fixed inset-0 overflow-hidden text-[#eef0f4]' : 'min-h-dvh text-[#eef0f4]'}>
      {authSession.user.kind === 'pm' ? (
        route.kind === 'pm-session' ? (
          <PmSessionPage accessToken={authSession.accessToken} onBack={openPmDashboard} sessionId={route.sessionId} />
        ) : route.kind === 'pm-session-history' || route.kind === 'pm-review-requests' ? (
          <PmActivityPage
            accessToken={authSession.accessToken}
            mode={route.kind === 'pm-session-history' ? 'sessions' : 'review-requests'}
            onOpenSession={openPmSession}
            onSignOut={clearAuthSession}
          />
        ) : (
          <PmDashboardPage
            accessToken={authSession.accessToken}
            onSignOut={clearAuthSession}
            onOpenSession={(sessionId) => openPmSession(sessionId)}
          />
        )
      ) : route.kind === 'developer-session' ? (
        <PmSessionPage
          accessToken={authSession.accessToken}
          isReadOnly
          onBack={openDeveloperHome}
          sessionId={route.sessionId}
        />
      ) : (
        <DeveloperHomePage onSignOut={clearAuthSession} session={authSession} />
      )}
    </main>
  );
}
