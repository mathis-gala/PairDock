import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge } from '../shared/bridge.js';

const bridge: DesktopBridge = {
  initialize: () => ipcRenderer.invoke('agent:initialize'),
  getSnapshot: () => ipcRenderer.invoke('agent:snapshot'),
  beginPairing: (input) => ipcRenderer.invoke('agent:pair', input),
  pollPairing: () => ipcRenderer.invoke('agent:poll-pairing'),
  cancelPairing: () => ipcRenderer.invoke('agent:cancel-pairing'),
  chooseFolder: () => ipcRenderer.invoke('agent:choose-folder'),
  saveProject: (draft) => ipcRenderer.invoke('agent:save-project', draft),
  removeProject: (key) => ipcRenderer.invoke('agent:remove-project', key),
  checkTools: () => ipcRenderer.invoke('agent:check-tools'),
  loginCodex: () => ipcRenderer.invoke('agent:login-codex'),
  runReadiness: (key) => ipcRenderer.invoke('agent:readiness', key),
  start: () => ipcRenderer.invoke('agent:start'),
  stop: () => ipcRenderer.invoke('agent:stop'),
  openPairing: () => ipcRenderer.invoke('agent:open-pairing'),
  openProjects: () => ipcRenderer.invoke('agent:open-projects'),
  openToolHelp: (tool) => ipcRenderer.invoke('agent:open-tool-help', tool),
  openDocker: () => ipcRenderer.invoke('agent:open-docker'),
  getPreferences: () => ipcRenderer.invoke('agent:preferences'),
  setLaunchAtLogin: (enabled) => ipcRenderer.invoke('agent:launch-at-login', enabled),
};

contextBridge.exposeInMainWorld('pairdock', bridge);
