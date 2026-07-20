export function isDevelopmentAuthEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.DEV_AUTH_ENABLED === 'true' && environment.NODE_ENV !== 'production';
}
