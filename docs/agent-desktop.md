# PairDock desktop setup

The macOS companion is the V1 setup path for developers joining a PairDock instance.
It runs the local agent on the developer's Mac; the API, web app and database remain on
the PairDock server. PMs need only the web app and their invitation.

## Before you begin

- Use a macOS build supplied by your instance operator. Windows and Linux desktop
  installers are outside this V1.
- Have the instance's API address, such as `https://api.example.com`. If the web and API
  use different hostnames, enter the API hostname in the desktop app. Remote addresses
  must use HTTPS; HTTP is accepted for loopback development only.
- Sign in with the GitHub account that can access the repository through the instance's
  GitHub App installation. The GitHub App connection does not replace your local Git
  access: the workstation still needs permission to read the repository and push the
  session branch.
- Install Git, the repository's runtime and its package manager. Select an existing
  clone with a GitHub `origin`; the app does not clone repositories for you.
- Have Docker Desktop installed and running for Docker previews or Cloudflare preview
  tunnels. The default shared-preview tunnel uses Docker even when the application
  itself runs directly on the Mac.
- The desktop distribution bundles Codex. Use **Connecter Codex** to finish sign-in in
  the browser, then **Vérifier à nouveau**. PairDock reads the model catalog available to
  that authenticated installation; it does not request an API key in the setup form.

## Associate the Mac with your account

1. Open PairDock and fill in **Adresse du serveur PairDock** and **Nom de cette machine**.
2. Choose **Continuer dans le navigateur**. PairDock displays a short device code and
   opens the instance's web verification page.
3. Sign in with GitHub if necessary. The pending device target survives this sign-in
   in the same browser tab and origin. A PM account cannot authorize a device.
4. Compare the device name and code with the desktop app. Choose **Autoriser cet appareil**
   only when they match. The web page never approves merely because it was opened.
5. Return to the desktop app. It retrieves the approved association automatically.

The code expires after ten minutes. If it expires, cancel and start a new association.
The desktop app also offers **Ouvrir le navigateur** when the verification tab has been
closed. In the web **Agents** page, **Vérifier le code** supports manual entry of the
displayed code. No permanent credential needs to be copied between applications.

## Add a repository

Choose **Ajouter un projet**, then select its folder in the native folder picker.
PairDock reads Git metadata, the package manager, available package scripts and any
existing `pairdock.yml`. Repository inspection does not execute those scripts.

Review the preview, build, test and lint selections before saving. Simple Vite and
Next.js preview scripts can be detected; unrecognized scripts, absent checks and
custom monorepos require settings in the form's **Réglages avancés**. Automatic detection
is a starting point, not a guarantee that the project is ready to run.

Configuration is stored in the local desktop profile. The app does not require you to
write `pairdock.yml` and does not rewrite an existing manifest. The existing manifest
can still supply advanced options such as sandbox settings or a project model allowlist.
Configure only repositories whose code you trust: setup, preview and check commands run
with the developer's local account permissions, with the runtime's environment filtering.

Choose **Vérifier le projet** to inspect readiness, then **Démarrer l’agent**. Use
**Ouvrir mes projets** to create the web project from the connected agent's published
repository and model options. The web project owns the model, reasoning level and PM
permissions; the desktop app owns paths and local execution settings.

Stop the agent before editing its configuration. An active agent operation prevents a
normal stop until it finishes. Stopping does not remove project repositories or reset
server projects; session runtime state remains available for recovery at the next start.

Closing the desktop window keeps the app in the macOS menu bar. Use **Arrêter l’agent**
to disconnect it, or **Quitter PairDock Agent** from the app menu to quit. In the installed
build, **Ouvrir PairDock à la connexion au Mac** starts the app at login and resumes the
configured agent when its prerequisites are available.

## Continue setup in the web app

Choose **Configurer le partage** on a local project to open the developer workspace with that project selected. The selection survives GitHub login. PairDock uses the agent’s repository, branch and supported models to suggest unambiguous defaults; typed values remain intact during discovery refreshes. The workspace guides the first project through connection, creation, a fresh readiness check and the PM invitation. Existing projects remain the primary view, with creation behind **Nouveau projet**.

In the desktop app, project readiness stays explicit: not checked, checking, ready or needs correction. Required failures remain visible with recovery actions; healthy tools and machine settings are collapsed. A failed or pending check does not reuse a previous success.

## Device state and revocation

In the web developer navigation, **Agents** lists only devices paired to the signed-in
account, with **En ligne**, **Hors ligne** or **Révoqué** state and last activity.
An offline device can reconnect by opening and starting its desktop agent. Keep the
Mac awake and the agent running while PMs need previews or new work.

To remove access, choose **Révoquer l’accès** beside the device and confirm inline.
The API records revocation, disconnects that agent and rejects its credential on future
requests. Revocation does not delete repositories, worktrees or the project's history.
It also does not promise to terminate an OS process that is already running locally.

A revoked device needs a new association before it can be used again. A new association
has a new agent identity and project-key scope; existing server projects are not silently
transferred to it. Keep or clean up earlier sessions through the normal project workflow.

## Local storage and boundaries

The native main process encrypts the device credential and project profile using
Electron `safeStorage`, backed by the macOS Keychain. The encrypted envelope is saved
as `agent/profile.json` beneath Electron's application-specific `userData` directory.
The directory and profile use owner-only permissions. If secure storage cannot be
unlocked, initialization fails instead of falling back to plaintext storage.

The desktop renderer receives connection state, device name and project configuration,
but never the permanent agent token or the private device claim code. The web pairing
page receives only the display name, short verification code and expiry. The API stores
credential hashes, device ownership and revocation state in PostgreSQL.

The desktop profile is separate from the CLI's `~/.pairdock/agent.json`; pairing does
not overwrite a working CLI profile. Session recovery references are stored separately
in a separate file scoped by agent identity beneath `agent/sessions/` in the desktop
profile directory, so pairing again cannot replay another identity's sessions. These recovery references
are not the encrypted credential profile. Codex manages its own login credentials.

Repository paths and execution settings remain local. The agent publishes the safe
project catalog needed by the web app: project key, name, GitHub repository, path alias,
branch and supported models. Session messages, diffs, validation results and preview
URLs continue to follow the normal PairDock workflow.

## Building and distributing the application

The repository contains the macOS desktop source and packaging entry point:

```bash
bun install
bun run --filter @pairdock/agent-desktop dev
bun run --filter @pairdock/agent-desktop package:mac
```

These are contributor commands, not steps that a developer receiving the application
must run. The package includes the Electron runtime and the pinned Codex executable.
Git, Docker and project-specific runtimes are workstation prerequisites rather than
bundled development environments.

Packaging and CI artifacts do not by themselves establish a public, signed release.
Configure Apple Developer signing and notarization in the release environment, verify
the resulting artifact on a clean Mac, and publish the installer before exposing a
download action in the web UI. No production signing identity, notarization credential
or public installer URL is configured by these instructions. Do not ask users to disable
macOS protections to compensate for an unsigned distribution.

The instance operator should distribute the API address alongside the actual macOS
installer. See [production deployment](../deploy/README.md) for the server requirements
and [advanced local-agent configuration](../README.md#advanced-local-agent-configuration)
for existing CLI agents, custom manifests and nested self-preview.
