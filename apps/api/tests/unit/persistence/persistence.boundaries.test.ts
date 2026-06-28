import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(currentDirectory, '..', '..', '..');
const apiSourceRoot = path.join(appRoot, 'src');
const persistenceRoot = path.join(apiSourceRoot, 'persistence');
const generatedPrismaRoot = path.join(apiSourceRoot, 'generated', 'prisma');
const repoRoot = path.resolve(appRoot, '..', '..');
const domainContractFile = path.join(repoRoot, 'packages', 'domain', 'src', 'index.ts');
const persistencePortRoot = path.join(persistenceRoot, 'ports');
const persistenceAdapterRoot = path.join(persistenceRoot, 'adapters');

function collectTypeScriptFiles(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTypeScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

const persistenceSurfaceFiles = [
  domainContractFile,
  path.join(persistenceRoot, 'persistence.tokens.ts'),
  path.join(persistenceRoot, 'persistence.module.ts'),
  ...collectTypeScriptFiles(persistencePortRoot),
];

test('BT-037: Prisma Client stays behind persistence adapters', () => {
  const tsFiles = collectTypeScriptFiles(apiSourceRoot).filter(
    (filePath) => !filePath.startsWith(persistenceRoot) && !filePath.startsWith(generatedPrismaRoot),
  );

  for (const filePath of tsFiles) {
    const content = fs.readFileSync(filePath, 'utf8');

    assert.equal(
      /@prisma\/client/.test(content),
      false,
      `${path.relative(apiSourceRoot, filePath)} should not import @prisma/client`,
    );

    assert.equal(
      /\bPrisma[A-Z]\w*/.test(content),
      false,
      `${path.relative(apiSourceRoot, filePath)} should not reference generated Prisma model types`,
    );
  }
});

test('BT-039: shared domain and persistence contracts stay source-control-provider neutral', () => {
  for (const filePath of persistenceSurfaceFiles) {
    const content = fs.readFileSync(filePath, 'utf8');

    assert.equal(
      /\bGithubInstallation\b/.test(content),
      false,
      `${path.relative(repoRoot, filePath)} should not expose GithubInstallation in shared contracts`,
    );

    assert.equal(
      /\bgithubInstallationId\b/.test(content),
      false,
      `${path.relative(repoRoot, filePath)} should not expose githubInstallationId in shared contracts`,
    );
  }
});

test('BT-041: persistence adapter filenames stay technology-agnostic inside the Prisma-backed package', () => {
  const adapterFiles = collectTypeScriptFiles(persistenceAdapterRoot);

  for (const filePath of adapterFiles) {
    assert.equal(
      path.basename(filePath).startsWith('prisma-'),
      false,
      `${path.relative(appRoot, filePath)} should not be prefixed with prisma-`,
    );
  }
});
