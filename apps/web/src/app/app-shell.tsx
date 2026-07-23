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
      <main className="min-h-screen text-[#20242b]">
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

  return (
    <main className="min-h-screen text-[#20242b]">
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
      ) : (
        <DeveloperHomePage onSignOut={clearAuthSession} session={authSession} />
      )}
    </main>
  );
}
