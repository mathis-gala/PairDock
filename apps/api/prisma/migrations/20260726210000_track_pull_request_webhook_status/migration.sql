ALTER TABLE "pull_requests"
ADD COLUMN "github_updated_at" TIMESTAMPTZ(6);

CREATE INDEX "pull_requests_github_pr_number_idx"
ON "pull_requests"("github_pr_number");
