import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, copyFile, cp, mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, Platform } from 'electron-builder';

const desktopRoot = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => !['--dir', '--signed'].includes(arg))) {
  throw new Error('Usage: node scripts/package.mjs [--dir] [--signed]');
}
if (process.platform !== 'darwin' || !['arm64', 'x64'].includes(process.arch)) {
  throw new Error('Build the macOS installer on a native arm64 or x64 Mac.');
}
const signed = args.has('--signed');
if (signed) {
  const hasCertificate = process.env.CSC_LINK || process.env.CSC_NAME;
  const hasNotarization =
    (process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER) ||
    (process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID) ||
    (process.env.APPLE_KEYCHAIN && process.env.APPLE_KEYCHAIN_PROFILE);
  if (!hasCertificate || !hasNotarization) {
    throw new Error('--signed requires a configured signing certificate and Apple notarization credentials.');
  }
} else {
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
  console.info('Building an unsigned local/CI artifact. This is not a notarized public release.');
}

const manifest = JSON.parse(await readFile(join(desktopRoot, 'package.json'), 'utf8'));
const codexVersion = manifest.devDependencies['@openai/codex'];
const nativePackage = dirname(require.resolve(`@openai/codex-darwin-${process.arch}/package.json`));
const target = process.arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
const vendorRoot = join(nativePackage, 'vendor', target);
const codexManifest = JSON.parse(await readFile(join(vendorRoot, 'codex-package.json'), 'utf8'));
if (codexVersion !== '0.155.1' || codexManifest.version !== codexVersion || codexManifest.target !== target) {
  throw new Error('The native Codex package must match the pinned 0.155.1 version and host architecture.');
}
await access(join(desktopRoot, manifest.main));
await access(join(desktopRoot, 'dist/renderer/index.html'));

const stagingRoot = await mkdtemp(join(tmpdir(), 'pairdock-desktop-package-'));
try {
  const appRoot = join(stagingRoot, 'app');
  const noticesRoot = join(stagingRoot, 'third-party');
  await mkdir(noticesRoot, { recursive: true });
  await cp(join(desktopRoot, 'dist'), join(appRoot, 'dist'), {
    recursive: true,
    filter: (source) => !source.endsWith('.map'),
  });
  // A dependency-free staging manifest prevents electron-builder from repackaging the monorepo.
  await writeFile(
    join(appRoot, 'package.json'),
    JSON.stringify({
      name: 'pairdock-agent',
      version: manifest.version,
      description: manifest.description,
      author: 'PairDock contributors',
      main: manifest.main,
      license: 'MIT',
    }),
  );
  await copyFile(new URL('../../../LICENSE', import.meta.url), join(appRoot, 'LICENSE'));

  const codexSource = `https://raw.githubusercontent.com/openai/codex/rust-v${codexVersion}`;
  const licenses = [
    ['Codex-LICENSE.txt', `${codexSource}/LICENSE`, 'd17f227e4df5da1600391338865ce0f3055211760a36688f816941d58232d8dc'],
    ['Codex-NOTICE.txt', `${codexSource}/NOTICE`, '9d71575ecfd9a843fc1677b0efb08053c6ba9fd686a0de1a6f5382fd3c220915'],
    ['ripgrep-COPYING.txt', 'https://raw.githubusercontent.com/BurntSushi/ripgrep/15.2.0/COPYING'],
    ['ripgrep-LICENSE-MIT.txt', 'https://raw.githubusercontent.com/BurntSushi/ripgrep/15.2.0/LICENSE-MIT'],
    ['ripgrep-UNLICENSE.txt', 'https://raw.githubusercontent.com/BurntSushi/ripgrep/15.2.0/UNLICENSE'],
    [
      'zsh-LICENCE.txt',
      'https://raw.githubusercontent.com/zsh-users/zsh/77045ef899e53b9598bebc5a41db93a548a40ca6/LICENCE',
    ],
  ];
  await Promise.all(
    licenses.map(async ([name, url, checksum]) => {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`Cannot retrieve required license ${name}: HTTP ${response.status}`);
      const body = Buffer.from(await response.arrayBuffer());
      if (checksum && createHash('sha256').update(body).digest('hex') !== checksum) {
        throw new Error(`The official ${name} differs from its verified checksum.`);
      }
      await writeFile(join(noticesRoot, name), body);
    }),
  );
  const packageNotices = await copyDependencyNotices(desktopRoot, noticesRoot);
  await writeFile(
    join(noticesRoot, 'README.txt'),
    [
      `PairDock Agent ${manifest.version} — third-party notices`,
      `OpenAI Codex ${codexVersion}: ${codexSource}`,
      'The complete native Codex vendor layout is preserved in ../codex, including voice library notices,',
      'licenses, source archive links and checksums under ../codex/codex-resources/voice/.',
      'Codex includes ripgrep 15.2.0 and the zsh source revision identified in zsh-LICENCE.txt’s source URL below.',
      ...licenses.map(([name, url]) => `${name}: ${url}`),
      'Electron-LICENSE.txt and LICENSES.chromium.html are copied from the packaged Electron distribution.',
      'Production JavaScript dependency licenses are preserved in packages/.',
      ...packageNotices,
      '',
    ].join('\n'),
  );
  const entitlements = join(stagingRoot, 'entitlements.mac.plist');
  await writeFile(
    entitlements,
    '<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>com.apple.security.cs.allow-jit</key><true/></dict></plist>',
  );

  await build({
    projectDir: appRoot,
    targets: Platform.MAC.createTarget(args.has('--dir') ? 'dir' : 'dmg'),
    publish: 'never',
    config: {
      appId: 'com.pairdock.agent',
      productName: 'PairDock Agent',
      electronVersion: manifest.devDependencies.electron,
      directories: { output: join(desktopRoot, 'release') },
      files: ['dist/**/*', 'package.json', 'LICENSE'],
      asar: true,
      npmRebuild: false,
      artifactName: `PairDock-Agent-\${version}-\${arch}${signed ? '' : '-unsigned'}.\${ext}`,
      extraResources: [
        { from: vendorRoot, to: 'codex' },
        { from: noticesRoot, to: 'third-party' },
      ],
      forceCodeSigning: signed,
      mac: {
        category: 'public.app-category.developer-tools',
        identity: signed ? undefined : null,
        hardenedRuntime: signed,
        notarize: signed,
        entitlements,
        entitlementsInherit: entitlements,
        binaries: [
          'Contents/Resources/codex/bin/codex',
          'Contents/Resources/codex/bin/codex-code-mode-host',
          'Contents/Resources/codex/codex-path/rg',
          'Contents/Resources/codex/codex-resources/zsh/bin/zsh',
        ],
      },
      async afterExtract({ appOutDir }) {
        // electron-builder otherwise removes both upstream notices while renaming Electron.app.
        const destination = join(appOutDir, 'Electron.app/Contents/Resources/third-party');
        await mkdir(destination, { recursive: true });
        await copyFile(join(appOutDir, 'LICENSE'), join(destination, 'Electron-LICENSE.txt'));
        await copyFile(join(appOutDir, 'LICENSES.chromium.html'), join(destination, 'LICENSES.chromium.html'));
      },
      async afterPack({ appOutDir }) {
        const resources = join(appOutDir, 'PairDock Agent.app/Contents/Resources');
        const version = execFileSync(join(resources, 'codex/bin/codex'), ['--version'], { encoding: 'utf8' }).trim();
        if (version !== `codex-cli ${codexVersion}`) throw new Error(`Unexpected bundled Codex version: ${version}`);
        for (const path of [
          'codex/codex-package.json',
          'third-party/Codex-LICENSE.txt',
          'third-party/LICENSES.chromium.html',
        ]) {
          await access(join(resources, path));
        }
        console.info(`Verified packaged ${version} (${process.arch}).`);
      },
    },
  });
} finally {
  await rm(stagingRoot, { recursive: true, force: true });
}

async function copyDependencyNotices(packageRoot, noticesRoot, seen = new Set()) {
  const root = await realpath(packageRoot);
  if (seen.has(root)) return [];
  seen.add(root);
  const metadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const notices = [`${metadata.name}@${metadata.version}: ${metadata.license ?? 'see package license'}`];
  if (!metadata.name.startsWith('@pairdock/')) {
    const destination = join(noticesRoot, 'packages', `${metadata.name.replaceAll('/', '__')}@${metadata.version}`);
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (entry.isFile() && /^(licen[cs]e|copying|copyright|notice)([.-]|$)/i.test(entry.name)) {
        await copyFile(join(root, entry.name), join(destination, entry.name));
      }
    }
  }
  const resolver = createRequire(join(root, 'package.json'));
  for (const dependency of Object.keys(metadata.dependencies ?? {})) {
    const candidates = resolver.resolve.paths(dependency) ?? [];
    let dependencyRoot;
    for (const directory of candidates) {
      const candidate = join(directory, dependency);
      try {
        await access(join(candidate, 'package.json'));
        dependencyRoot = candidate;
        break;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    if (!dependencyRoot) throw new Error(`Missing production dependency ${dependency}; run bun install first.`);
    notices.push(...(await copyDependencyNotices(dependencyRoot, noticesRoot, seen)));
  }
  return notices;
}
