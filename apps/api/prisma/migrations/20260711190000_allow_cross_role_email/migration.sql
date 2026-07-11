DROP INDEX IF EXISTS "users_email_key";

CREATE UNIQUE INDEX "users_email_kind_key" ON "users"("email", "kind");
