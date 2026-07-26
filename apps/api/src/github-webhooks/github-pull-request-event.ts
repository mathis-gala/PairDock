import { BadRequestException } from '@nestjs/common';
import type { UpdateReviewRequestStatusInput } from '../persistence/ports/review-requests.repository.js';

type JsonObject = Record<string, unknown>;

export function parseGithubPullRequestEvent(payload: unknown): UpdateReviewRequestStatusInput {
  const root = requireObject(payload, 'payload');
  const installation = requireObject(root.installation, 'installation');
  const repository = requireObject(root.repository, 'repository');
  const pullRequest = requireObject(root.pull_request, 'pull_request');
  const reviewRequestNumber = requirePositiveInteger(root.number, 'number');
  const pullRequestNumber = requirePositiveInteger(pullRequest.number, 'pull_request.number');

  if (reviewRequestNumber !== pullRequestNumber) {
    throw new BadRequestException('GitHub pull request numbers do not match.');
  }

  return {
    providerConnectionId: requireIdentifier(installation.id, 'installation.id'),
    repoFullName: requireNonEmptyString(repository.full_name, 'repository.full_name'),
    reviewRequestNumber,
    reviewRequestUrl: requireUrl(pullRequest.html_url, 'pull_request.html_url'),
    status: resolveReviewRequestStatus(pullRequest),
    statusUpdatedAt: requireDate(pullRequest.updated_at, 'pull_request.updated_at'),
  };
}

function resolveReviewRequestStatus(pullRequest: JsonObject): UpdateReviewRequestStatusInput['status'] {
  const state = requireNonEmptyString(pullRequest.state, 'pull_request.state');
  const draft = requireBoolean(pullRequest.draft, 'pull_request.draft');
  const merged = requireBoolean(pullRequest.merged, 'pull_request.merged');

  if (merged || typeof pullRequest.merged_at === 'string') {
    return 'merged';
  }

  if (state === 'closed') {
    return 'closed';
  }

  if (state !== 'open') {
    throw new BadRequestException('pull_request.state must be "open" or "closed".');
  }

  return draft ? 'draft' : 'open';
}

function requireObject(value: unknown, fieldName: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(`${fieldName} must be an object.`);
  }

  return value as JsonObject;
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} must be a non-empty string.`);
  }

  return value;
}

function requireBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${fieldName} must be a boolean.`);
  }

  return value;
}

function requirePositiveInteger(value: unknown, fieldName: string): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer.`);
  }

  return Number(value);
}

function requireIdentifier(value: unknown, fieldName: string): string {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim().length === 0) {
    throw new BadRequestException(`${fieldName} must be an identifier.`);
  }

  return String(value);
}

function requireDate(value: unknown, fieldName: string): Date {
  const stringValue = requireNonEmptyString(value, fieldName);
  const date = new Date(stringValue);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be an ISO date.`);
  }

  return date;
}

function requireUrl(value: unknown, fieldName: string): string {
  const stringValue = requireNonEmptyString(value, fieldName);

  try {
    const url = new URL(stringValue);

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Unsupported URL protocol.');
    }
  } catch {
    throw new BadRequestException(`${fieldName} must be an HTTP URL.`);
  }

  return stringValue;
}
