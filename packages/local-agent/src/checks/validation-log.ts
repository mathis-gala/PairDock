import { MAX_AGENT_LOG_LENGTH } from '@pairdock/shared-contracts';

const diagnosticLinePattern =
  /^not ok\b|assertionerror|failuretype|cannot find|not found|timed out|exception|error:|expected|received/i;
const diagnosticSectionLabel = '[Validation failure context]';
const truncatedSectionLabel = '[Earlier validation output compacted]';

export function compactValidationLogs(logs: string, maximumLength = MAX_AGENT_LOG_LENGTH): string {
  if (logs.length <= maximumLength) {
    return logs;
  }

  const diagnosticBudget = Math.floor(maximumLength * 0.4);
  const diagnosticLines = logs
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && diagnosticLinePattern.test(line));
  const uniqueDiagnosticLines = [...new Set(diagnosticLines)]
    .map((line) => line.slice(0, 1_000))
    .join('\n')
    .slice(0, diagnosticBudget);
  const prefix = uniqueDiagnosticLines
    ? `${diagnosticSectionLabel}\n${uniqueDiagnosticLines}\n${truncatedSectionLabel}\n`
    : `${truncatedSectionLabel}\n`;
  const tailLength = Math.max(0, maximumLength - prefix.length);

  return `${prefix}${logs.slice(-tailLength)}`;
}
