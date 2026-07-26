CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "message_id" UUID,
    "created_by_user_id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "attachments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attachments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "attachments_visibility_object_key_key" ON "attachments"("visibility", "object_key");
CREATE INDEX "attachments_session_id_idx" ON "attachments"("session_id");
CREATE INDEX "attachments_message_id_idx" ON "attachments"("message_id");
CREATE INDEX "attachments_created_by_user_id_idx" ON "attachments"("created_by_user_id");
