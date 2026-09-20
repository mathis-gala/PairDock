-- AlterTable
ALTER TABLE "agent_registrations" ADD COLUMN     "credential_hash" TEXT,
ADD COLUMN     "paired_at" TIMESTAMPTZ(6),
ADD COLUMN     "project_key_prefix" TEXT,
ADD COLUMN     "revoked_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "agent_pairings" (
    "id" UUID NOT NULL,
    "device_code_hash" TEXT NOT NULL,
    "user_code" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "owner_user_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "claimed_at" TIMESTAMPTZ(6),

    CONSTRAINT "agent_pairings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_pairings_device_code_hash_key" ON "agent_pairings"("device_code_hash");

-- CreateIndex
CREATE UNIQUE INDEX "agent_pairings_user_code_key" ON "agent_pairings"("user_code");

-- CreateIndex
CREATE INDEX "agent_pairings_expires_at_idx" ON "agent_pairings"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "agent_registrations_credential_hash_key" ON "agent_registrations"("credential_hash");

-- CreateIndex
CREATE UNIQUE INDEX "agent_registrations_project_key_prefix_key" ON "agent_registrations"("project_key_prefix");

-- AddForeignKey
ALTER TABLE "agent_pairings" ADD CONSTRAINT "agent_pairings_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
