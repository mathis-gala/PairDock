-- CreateEnum
CREATE TYPE "UserKind" AS ENUM ('developer', 'pm');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('CREATED', 'AGENT_CONNECTING', 'WORKTREE_CREATING', 'DOCKER_STARTING', 'PREVIEW_STARTING', 'READY', 'AGENT_RUNNING', 'CHECKS_RUNNING', 'AWAITING_PM_VALIDATION', 'REVIEW_REQUEST_CREATING', 'REVIEW_REQUEST_CREATED', 'CLOSING', 'CLOSED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "kind" "UserKind" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "provider_team_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_installations" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "github_installation_id" TEXT NOT NULL,
    "account_login" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "github_installation_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "repo_full_name" TEXT NOT NULL,
    "default_branch" TEXT NOT NULL,
    "default_model_id" TEXT NOT NULL DEFAULT 'codex-cli/gpt-5.4',
    "pm_can_start_sessions" BOOLEAN NOT NULL DEFAULT true,
    "agent_project_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_readiness_snapshots" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "checks" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "project_readiness_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "status" "SessionStatus" NOT NULL,
    "model_id" TEXT NOT NULL,
    "branch_name" TEXT,
    "worktree_ref" TEXT,
    "preview_url" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_members" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "session_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_events" (
    "id" UUID NOT NULL,
    "session_id" UUID,
    "agent_id" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_registrations" (
    "id" UUID NOT NULL,
    "agent_id" TEXT NOT NULL,
    "owner_user_id" UUID,
    "display_name" TEXT,
    "protocol_version" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL DEFAULT '[]',
    "models" JSONB NOT NULL DEFAULT '[]',
    "projects" JSONB NOT NULL DEFAULT '[]',
    "connected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "agent_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_runs" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "build_status" TEXT,
    "test_status" TEXT,
    "lint_status" TEXT,
    "preview_status" TEXT,
    "logs_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pull_requests" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "github_pr_number" INTEGER,
    "github_pr_url" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pull_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_kind_key" ON "users"("email", "kind");

-- CreateIndex
CREATE INDEX "external_identities_user_id_idx" ON "external_identities"("user_id");

-- CreateIndex
CREATE INDEX "external_identities_provider_provider_user_id_provider_team_idx" ON "external_identities"("provider", "provider_user_id", "provider_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_identities_provider_provider_user_id_provider_team_key" ON "external_identities"("provider", "provider_user_id", "provider_team_id");

-- CreateIndex
CREATE INDEX "github_installations_owner_user_id_idx" ON "github_installations"("owner_user_id");

-- CreateIndex
CREATE INDEX "projects_owner_user_id_idx" ON "projects"("owner_user_id");

-- CreateIndex
CREATE INDEX "projects_github_installation_id_idx" ON "projects"("github_installation_id");

-- CreateIndex
CREATE INDEX "project_members_project_id_idx" ON "project_members"("project_id");

-- CreateIndex
CREATE INDEX "project_members_user_id_idx" ON "project_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_readiness_snapshots_project_id_key" ON "project_readiness_snapshots"("project_id");

-- CreateIndex
CREATE INDEX "project_readiness_snapshots_project_id_idx" ON "project_readiness_snapshots"("project_id");

-- CreateIndex
CREATE INDEX "sessions_project_id_idx" ON "sessions"("project_id");

-- CreateIndex
CREATE INDEX "sessions_created_by_user_id_idx" ON "sessions"("created_by_user_id");

-- CreateIndex
CREATE INDEX "session_members_session_id_idx" ON "session_members"("session_id");

-- CreateIndex
CREATE INDEX "session_members_user_id_idx" ON "session_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_members_session_id_user_id_key" ON "session_members"("session_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_session_id_idx" ON "messages"("session_id");

-- CreateIndex
CREATE INDEX "agent_events_session_id_idx" ON "agent_events"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_registrations_agent_id_key" ON "agent_registrations"("agent_id");

-- CreateIndex
CREATE INDEX "agent_registrations_owner_user_id_idx" ON "agent_registrations"("owner_user_id");

-- CreateIndex
CREATE INDEX "agent_registrations_last_seen_at_idx" ON "agent_registrations"("last_seen_at");

-- CreateIndex
CREATE INDEX "validation_runs_session_id_idx" ON "validation_runs"("session_id");

-- CreateIndex
CREATE INDEX "pull_requests_session_id_idx" ON "pull_requests"("session_id");

-- AddForeignKey
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_github_installation_id_fkey" FOREIGN KEY ("github_installation_id") REFERENCES "github_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_readiness_snapshots" ADD CONSTRAINT "project_readiness_snapshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_members" ADD CONSTRAINT "session_members_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_members" ADD CONSTRAINT "session_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_registrations" ADD CONSTRAINT "agent_registrations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_runs" ADD CONSTRAINT "validation_runs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
