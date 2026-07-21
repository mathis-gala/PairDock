export interface AuthEnvironment {
  DEV_PM_AUTH_ENABLED?: string;
  NODE_ENV?: string;
}

export function isDevelopmentPmAuthEnabled(environment: AuthEnvironment = process.env): boolean {
  return environment.NODE_ENV !== 'production' && environment.DEV_PM_AUTH_ENABLED === 'true';
}

export function areIdentityFixturesEnabled(environment: AuthEnvironment = process.env): boolean {
  return environment.NODE_ENV === 'test';
}
