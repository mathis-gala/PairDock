CREATE TABLE "agent_registrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" TEXT NOT NULL,
  "owner_user_id" UUID,
  "display_name" TEXT,
  "protocol_version" INTEGER NOT NULL,
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

CREATE UNIQUE INDEX "agent_registrations_agent_id_key" ON "agent_registrations"("agent_id");
CREATE INDEX "agent_registrations_owner_user_id_idx" ON "agent_registrations"("owner_user_id");
CREATE INDEX "agent_registrations_last_seen_at_idx" ON "agent_registrations"("last_seen_at");

ALTER TABLE "agent_registrations" ADD CONSTRAINT "agent_registrations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
