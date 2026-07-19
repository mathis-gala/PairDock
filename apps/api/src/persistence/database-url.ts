interface DatabaseEnvironment {
  DATABASE_URL?: string;
  NODE_ENV?: string;
  TEST_DATABASE_URL?: string;
}

interface DatabaseTarget {
  databaseName: string;
}

const testMarkerPattern = /(^|[-_])tests?($|[-_])/i;

export function resolveDatabaseConnectionString(environment: DatabaseEnvironment): string {
  const applicationUrl = environment.DATABASE_URL;

  if (!applicationUrl) {
    throw new Error('DATABASE_URL is required to initialize the database client.');
  }

  if (environment.NODE_ENV !== 'test') {
    return applicationUrl;
  }

  const testUrl = environment.TEST_DATABASE_URL;

  if (!testUrl) {
    throw new Error('TEST_DATABASE_URL is required when NODE_ENV=test. Refusing to use the application database.');
  }

  const applicationTarget = parseDatabaseTarget(applicationUrl, 'DATABASE_URL');
  const testTarget = parseDatabaseTarget(testUrl, 'TEST_DATABASE_URL');

  if (applicationTarget.databaseName === testTarget.databaseName) {
    throw new Error('TEST_DATABASE_URL must target a different database than DATABASE_URL.');
  }

  if (!testMarkerPattern.test(testTarget.databaseName)) {
    throw new Error('TEST_DATABASE_URL database name must contain a test marker.');
  }

  return testUrl;
}

function parseDatabaseTarget(connectionString: string, variableName: string): DatabaseTarget {
  let url: URL;

  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL.`);
  }

  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error(`${variableName} must use the postgresql:// or postgres:// protocol.`);
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ''));

  if (!databaseName || databaseName.includes('/')) {
    throw new Error(`${variableName} must include exactly one database name.`);
  }

  return {
    databaseName,
  };
}
