export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  kind: 'developer' | 'pm';
}

export interface AuthSession {
  accessToken: string;
  provider: 'github' | 'slack';
  user: AuthenticatedUser;
}
