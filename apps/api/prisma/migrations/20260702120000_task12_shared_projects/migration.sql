-- AlterTable
ALTER TABLE "projects"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "default_model_id" TEXT NOT NULL DEFAULT 'codex-cli/gpt-5.4',
  ADD COLUMN "pm_can_start_sessions" BOOLEAN NOT NULL DEFAULT true;

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

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_readiness_snapshots" ADD CONSTRAINT "project_readiness_snapshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
