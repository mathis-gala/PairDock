import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDatabaseConnectionString } from '../../../../../apps/api/src/persistence/database-url.js';

const developmentUrl = 'postgresql://developer:secret@127.0.0.1:55432/pairdock';

test('production runtime uses DATABASE_URL', () => {
  assert.equal(
    resolveDatabaseConnectionString({ DATABASE_URL: developmentUrl, NODE_ENV: 'development' }),
    developmentUrl,
  );
});

test('test runtime requires TEST_DATABASE_URL', () => {
  assert.throws(
    () => resolveDatabaseConnectionString({ DATABASE_URL: developmentUrl, NODE_ENV: 'test' }),
    /TEST_DATABASE_URL is required/,
  );
});

test('test runtime rejects the application database even when credentials differ', () => {
  assert.throws(
    () =>
      resolveDatabaseConnectionString({
        DATABASE_URL: developmentUrl,
        NODE_ENV: 'test',
        TEST_DATABASE_URL: 'postgresql://other:credentials@127.0.0.1:55432/pairdock',
      }),
    /must target a different database/,
  );
});

test('test runtime rejects the same database name behind another hostname', () => {
  assert.throws(
    () =>
      resolveDatabaseConnectionString({
        DATABASE_URL: 'postgresql://developer:secret@database.internal:5432/pairdock_test',
        NODE_ENV: 'test',
        TEST_DATABASE_URL: 'postgresql://developer:secret@localhost:5432/pairdock_test',
      }),
    /must target a different database/,
  );
});

test('test runtime rejects a target without an explicit test marker', () => {
  assert.throws(
    () =>
      resolveDatabaseConnectionString({
        DATABASE_URL: developmentUrl,
        NODE_ENV: 'test',
        TEST_DATABASE_URL: 'postgresql://developer:secret@127.0.0.1:55432/pairdock_staging',
      }),
    /database name must contain a test marker/,
  );
});

test('test runtime accepts a dedicated test database', () => {
  const testUrl = 'postgresql://developer:secret@127.0.0.1:55432/pairdock_test';

  assert.equal(
    resolveDatabaseConnectionString({
      DATABASE_URL: developmentUrl,
      NODE_ENV: 'test',
      TEST_DATABASE_URL: testUrl,
    }),
    testUrl,
  );
});

test('test runtime rejects a test schema inside the application database', () => {
  const testUrl = 'postgresql://developer:secret@127.0.0.1:55432/pairdock?schema=pairdock_test';

  assert.throws(
    () =>
      resolveDatabaseConnectionString({
        DATABASE_URL: developmentUrl,
        NODE_ENV: 'test',
        TEST_DATABASE_URL: testUrl,
      }),
    /must target a different database/,
  );
});
