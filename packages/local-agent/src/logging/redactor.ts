const REDACTED = '[REDACTED]';

const envAssignmentPattern =
  /((?:^|\n)(?:export\s+)?[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*=)([^\n]*)/gim;
const labeledSecretPattern = /((?:token|secret|api[_-]?key|password)\s*[:=]\s*)([^\s]+)/gim;
const bearerPattern = /(Bearer\s+)([^\s]+)/g;
const githubTokenPattern = /\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g;
const openAiTokenPattern = /\bsk-[A-Za-z0-9]{10,}\b/g;
const slackTokenPattern = /\bxox[baprs]-[A-Za-z0-9-]+\b/g;

export class LogRedactor {
  redact(text: string): string {
    return text
      .replace(envAssignmentPattern, (_, prefix: string) => `${prefix}${REDACTED}`)
      .replace(labeledSecretPattern, (_, prefix: string) => `${prefix}${REDACTED}`)
      .replace(bearerPattern, (_, prefix: string) => `${prefix}${REDACTED}`)
      .replace(githubTokenPattern, REDACTED)
      .replace(openAiTokenPattern, REDACTED)
      .replace(slackTokenPattern, REDACTED);
  }
}
