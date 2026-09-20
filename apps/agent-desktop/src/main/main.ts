import { execFile } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir, hostname } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { DesktopAgentManager } from '@pairdock/local-agent/desktop';
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, protocol, safeStorage, shell, Tray } from 'electron';
import { z } from 'zod';
import type { DesktopPreferences } from '../shared/bridge.js';
import { resolveRendererAsset, validateExternalUrl, validateRendererUrl } from './native-policy.js';

app.setName('PairDock Agent');
if (!app.isPackaged && process.env.PAIRDOCK_DESKTOP_DATA_DIR) {
  app.setPath('userData', process.env.PAIRDOCK_DESKTOP_DATA_DIR);
}
protocol.registerSchemesAsPrivileged([{ scheme: 'pairdock', privileges: { standard: true, secure: true } }]);

const keySchema = z.string().regex(/^[A-Za-z0-9._-]{1,128}$/);
const allowedFolders = new Set<string>();
let window: BrowserWindow | null = null;
let tray: Tray | null = null;
let manager: DesktopAgentManager;
let quitting = false;
let stopping = false;

function preferences(): DesktopPreferences {
  const canLaunchAtLogin = app.isPackaged && process.platform === 'darwin';
  return {
    deviceName: hostname().replace(/\.local$/, ''),
    canLaunchAtLogin,
    launchAtLogin: canLaunchAtLogin && app.getLoginItemSettings().openAtLogin,
  };
}

function showWindow() {
  window?.show();
  window?.focus();
}

function refreshTray() {
  if (!tray || !manager) return;
  const state = manager.getSnapshot();
  const label = state.busy ? 'Tâche en cours' : state.status === 'online' ? 'Agent connecté' : 'Ouvrir PairDock Agent';
  tray.setToolTip(`PairDock — ${label}`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label, click: showWindow },
      { type: 'separator' },
      { label: 'Quitter PairDock Agent', click: () => app.quit() },
    ]),
  );
}

function bundledCodex(): string {
  if (app.isPackaged) return join(process.resourcesPath, 'codex', 'bin', 'codex');
  const require = createRequire(join(app.getAppPath(), 'package.json'));
  const architecture = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
  const packageRoot = dirname(require.resolve(`@openai/codex-darwin-${process.arch}/package.json`));
  return join(packageRoot, 'vendor', `${architecture}-apple-darwin`, 'bin', 'codex');
}

function registerHandlers() {
  const handle = (channel: string, action: (...args: unknown[]) => unknown) => {
    ipcMain.handle(channel, (event, ...args: unknown[]) => {
      if (
        event.sender !== window?.webContents ||
        event.senderFrame !== window.webContents.mainFrame ||
        !validateRendererUrl(event.senderFrame.url)
      )
        throw new Error('Untrusted application frame.');
      return action(...args);
    });
  };
  handle('agent:initialize', () => manager.initialize());
  handle('agent:snapshot', () => manager.getSnapshot());
  handle('agent:pair', (input) =>
    manager.beginPairing(
      z
        .object({
          backendUrl: z.string().max(2_048),
          deviceName: z.string().min(1).max(100),
        })
        .parse(input),
    ),
  );
  handle('agent:poll-pairing', () => manager.pollPairing());
  handle('agent:cancel-pairing', () => manager.cancelPairing());
  handle('agent:choose-folder', async () => {
    if (!window) return null;
    const result = await dialog.showOpenDialog(window, {
      title: 'Choisir un dépôt Git',
      properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const path = await realpath(result.filePaths[0]);
    const draft = await manager.inspectProject(path);
    allowedFolders.add(path);
    return draft;
  });
  handle('agent:save-project', async (input) => {
    const { path } = z.object({ path: z.string().min(1).max(4_096) }).parse(input);
    const configured = manager.getSnapshot().projects.some((project) => project.path === path);
    if (!allowedFolders.has(path) && !configured)
      throw new Error('Choose this folder in the native folder picker first.');
    if ((await realpath(path)) !== path) throw new Error('The selected folder has changed. Choose it again.');
    // The manager validates the complete draft before reading project metadata or saving it.
    return manager.saveProject(input);
  });
  handle('agent:remove-project', (key) => manager.removeProject(keySchema.parse(key)));
  handle('agent:check-tools', () => manager.checkTools());
  handle('agent:login-codex', () => manager.loginCodex());
  handle('agent:readiness', (key) => manager.runReadiness(keySchema.parse(key)));
  handle('agent:start', () => manager.start());
  handle('agent:stop', () => manager.stop());
  handle('agent:open-pairing', async () => {
    const pairing = manager.getSnapshot().pairing;
    if (!pairing) throw new Error('Start pairing first.');
    await shell.openExternal(validateExternalUrl(pairing.verificationUrl));
  });
  handle('agent:open-projects', async (input) => {
    const snapshot = manager.getSnapshot();
    const connection = snapshot.connection;
    if (!connection) throw new Error('Pair this computer first.');
    const projectKey = keySchema.optional().parse(input);
    if (projectKey && !snapshot.projects.some((project) => project.key === projectKey)) {
      throw new Error('Ce projet n’est plus configuré sur ce Mac.');
    }
    const url = new URL(connection.frontendUrl);
    url.hash = projectKey ? `/developer?agentProjectKey=${encodeURIComponent(projectKey)}` : '/developer';
    await shell.openExternal(validateExternalUrl(url.toString()));
  });
  handle('agent:open-tool-help', async (input) => {
    const tool = z.enum(['git', 'docker', 'codex']).parse(input);
    if (tool === 'git') {
      await promisify(execFile)('/usr/bin/xcode-select', ['--install'], { timeout: 15_000, maxBuffer: 64 * 1_024 });
      return;
    }
    await shell.openExternal(
      tool === 'docker'
        ? 'https://www.docker.com/products/docker-desktop/'
        : 'https://developers.openai.com/codex/auth/',
    );
  });
  handle('agent:open-docker', async () => {
    const error = await shell.openPath('/Applications/Docker.app');
    if (error) throw new Error('Docker Desktop could not be opened. Install it in Applications and retry.');
  });
  handle('agent:preferences', preferences);
  handle('agent:launch-at-login', (input) => {
    const enabled = z.boolean().parse(input);
    if (!preferences().canLaunchAtLogin) throw new Error('Launch at login requires the installed macOS application.');
    app.setLoginItemSettings({ openAtLogin: enabled });
    return preferences();
  });
}

async function launch() {
  const codexCommand = bundledCodex();
  // Finder does not inherit the developer's interactive shell PATH.
  process.env.PATH = [
    ...new Set([
      join(dirname(dirname(codexCommand)), 'codex-path'),
      '/opt/homebrew/bin',
      '/usr/local/bin',
      join(homedir(), '.bun/bin'),
      join(homedir(), '.local/bin'),
      ...(process.env.PATH ?? '/usr/bin:/bin:/usr/sbin:/sbin').split(':'),
    ]),
  ].join(':');
  manager = new DesktopAgentManager({
    profileDirectory: join(app.getPath('userData'), 'agent'),
    codexCommand,
    encrypt: (plaintext) => {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('The macOS keychain is unavailable.');
      return safeStorage.encryptString(plaintext).toString('base64');
    },
    decrypt: (ciphertext) => {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('The macOS keychain is unavailable.');
      return safeStorage.decryptString(Buffer.from(ciphertext, 'base64'));
    },
    onChange: refreshTray,
  });
  // Initialization failures are exposed in the snapshot, including a locked keychain.
  await manager.initialize().catch(() => undefined);
  const rendererDirectory = join(__dirname, '../renderer');
  protocol.handle('pairdock', async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405 });
    try {
      const path = resolveRendererAsset(rendererDirectory, request.url);
      const contentType = path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html';
      return new Response(request.method === 'HEAD' ? null : await readFile(path), {
        headers: {
          'Content-Type': `${contentType}; charset=utf-8`,
          'Content-Security-Policy':
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'",
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      return new Response('Asset not found', { status: 404 });
    }
  });
  window = new BrowserWindow({
    width: 1_040,
    height: 820,
    minWidth: 760,
    minHeight: 600,
    title: 'PairDock Agent',
    backgroundColor: '#101312',
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  window.webContents.session.setPermissionCheckHandler(() => false);
  window.on('close', (event) => {
    if (!quitting) {
      event.preventDefault();
      window?.hide();
    }
  });
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'PairDock Agent',
        submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'quit' }],
      },
      { role: 'editMenu' },
      { role: 'windowMenu' },
    ]),
  );
  const icon = nativeImage.createFromNamedImage('desktopcomputer', { pointSize: 18 });
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.on('click', showWindow);
  refreshTray();
  registerHandlers();
  await window.loadURL('pairdock://app/index.html');
  if (app.isPackaged && app.getLoginItemSettings().wasOpenedAtLogin && manager.getSnapshot().connection) {
    try {
      await manager.start();
    } catch {
      showWindow();
    }
  } else {
    showWindow();
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.on('activate', showWindow);
  app.on('before-quit', (event) => {
    if (quitting || !manager) return;
    event.preventDefault();
    if (stopping) return;
    stopping = true;
    manager
      .stop()
      .then(() => {
        quitting = true;
        app.quit();
      })
      .catch((error: unknown) => {
        stopping = false;
        showWindow();
        dialog.showErrorBox(
          'Impossible de quitter maintenant',
          error instanceof Error ? error.message : 'Réessaie après la tâche en cours.',
        );
      });
  });
  app
    .whenReady()
    .then(launch)
    .catch((error: unknown) => {
      dialog.showErrorBox('PairDock Agent', error instanceof Error ? error.message : 'Application startup failed.');
      quitting = true;
      app.quit();
    });
}
