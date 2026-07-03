import { clearAuthSession, setAuthSession, useAuthSession } from '../auth/auth-store.js';
import { DeveloperHomePage } from '../auth/developer-home-page.js';
import { LoginPage } from '../auth/login-page.js';
import { AppHeader } from '../layout/app-header.js';
import { PmDashboardPage } from '../pm-session/pm-dashboard-page.js';
import { PmSessionPage } from '../pm-session/pm-session-page.js';
import { openDeveloperHome, openPmDashboard, openPmSession, useAppRoute } from '../routing/route-store.js';

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
