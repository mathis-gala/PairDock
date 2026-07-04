import type { ToolReadinessCheck, ToolReadinessKey, ToolReadinessStatus } from '@pairdock/domain';
import type { Prisma } from '../../generated/prisma/client.js';

/**
 * Runtime parsing for the Prisma JSON boundary. Prisma stores JSON columns as
 * `Prisma.JsonValue` (an opaque union of null / boolean / number / string /
 * array / object); the domain needs specific shapes. These functions parse the
 * value at runtime and throw when the shape does not match, instead of
 * asserting a type that was never checked.
 *
 * The matching write helpers serialize domain values back into the exact
 * `Prisma.InputJson*` shapes so repository code never needs a cast.
 */

// ---- read side: Prisma.JsonValue -> domain ----

export function parseJsonObject(value: Prisma.JsonValue): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  throw new Error('Expected a JSON object from the database but received a different JSON shape.');
}

export function parseToolReadinessChecks(value: Prisma.JsonValue): ToolReadinessCheck[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const checks: ToolReadinessCheck[] = [];

  for (const entry of value) {
    const parsed = parseToolReadinessCheck(entry);
    if (parsed) {
      checks.push(parsed);
    }
  }

  return checks;
}

function parseToolReadinessCheck(value: Prisma.JsonValue): ToolReadinessCheck | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const { key, status, required, message, remediation } = value;

  if (
    typeof key !== 'string' ||
    typeof status !== 'string' ||
    typeof required !== 'boolean' ||
    (message !== null && typeof message !== 'string') ||
    (remediation !== null && typeof remediation !== 'string')
  ) {
    return null;
  }

  if (!isToolReadinessKey(key) || !isToolReadinessStatus(status)) {
    return null;
  }

  return { key, status, required, message, remediation };
}

function isToolReadinessKey(value: string): value is ToolReadinessKey {
  return (
    value === 'agent' ||
    value === 'git' ||
    value === 'repository' ||
    value === 'source-control' ||
    value === 'agent-harness' ||
    value === 'docker' ||
    value === 'preview-tunnel' ||
    value === 'project-commands'
  );
}

function isToolReadinessStatus(value: string): value is ToolReadinessStatus {
  return value === 'passed' || value === 'failed' || value === 'warning' || value === 'skipped';
}

// ---- write side: domain -> Prisma.InputJson* ----

export function serializeJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return toInputJsonObject(value);
}

export function serializeJsonValue(value: unknown): Prisma.InputJsonValue {
  return toInputJsonValue(value);
}

export function serializeChecks(checks: ToolReadinessCheck[]): Prisma.InputJsonArray {
  return checks.map(serializeToolReadinessCheck);
}

function serializeToolReadinessCheck(check: ToolReadinessCheck): Prisma.InputJsonObject {
  return {
    key: check.key,
    status: check.status,
    required: check.required,
    message: check.message,
    remediation: check.remediation,
  };
}

/**
 * Recursive coercion of an untrusted value into Prisma's JSON input shape.
 * `undefined` entries (which Prisma rejects) are dropped; everything else is
 * copied verbatim once its concrete JSON type is confirmed at runtime.
 */
function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toInputJsonValue);
  }

  if (typeof value === 'object' && value !== null) {
    return toInputJsonObject(value);
  }

  throw new Error('Value cannot be serialized to a JSON column.');
}

function toInputJsonObject(value: object): Prisma.InputJsonObject {
  const result: Record<string, Prisma.InputJsonValue | null> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) {
      continue;
    }

    result[key] = entry === null ? null : toInputJsonValue(entry);
  }

  return result;
}
