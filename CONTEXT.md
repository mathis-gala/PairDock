# PairDock domain language

## Project

A developer-owned repository configuration shared with invited product managers. It
binds source-control access, an owning local agent, execution settings and readiness.

## Paired device

A local agent associated with one authenticated developer through an expiring device
code and an explicit browser approval. The API owns device identity, credential hashes,
project-key scope and revocation. The developer can list and revoke only their own
paired devices; revocation disconnects the agent and blocks its credential.

## Desktop companion

The macOS application used to pair a device, select existing local repositories,
configure project scripts, connect the agent harness and start or stop the local agent.
It shares the existing local-agent runtime with the advanced CLI. Device credentials
and project settings stay in an encrypted machine-local profile; the web interface
receives device state and safe project metadata, never the agent credential or local
repository paths.

## Session

An isolated change request in a Project, with its own worktree, conversation, preview,
validation history and review request. The backend owns its durable lifecycle; the
local agent owns the machine-local resources needed to execute it.

## Session synchronization

The browser's coordination of Session reads, conversation data, live notifications
and mutation responses. It maintains one coherent projection for an authenticated
identity and Session, including reconnect catch-up and message reconciliation.

## Prompt execution

One local-agent turn for a Session: consume the prompt and captures, run the agent
harness, inspect the resulting diff, run checks and make bounded validation repairs.
The turn includes its resource cleanup, filtered output and completion events.

## Validation

The build, test, lint and preview results for a Session. A prompt that makes no file
changes preserves the relevant previous validation outcome. Successful validation
allows the Session to await PM validation before a review request.

## Session event application

The backend's application of a lifecycle event, including the transition and the
atomic recording of the event, any Validation result and the resulting Session
state. Transport decoding and caller authorization happen before this operation.

## Review request

A request to review a validated Session's changes. The local agent pushes its branch;
the backend creates the draft pull request using the developer's source-control
connection.
