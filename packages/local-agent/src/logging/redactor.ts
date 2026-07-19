const REDACTED = '[REDACTED]';

const envAssignmentPattern =
  /((?:^|\n)(?:export\s+)?[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY|CREDENTIAL|DATABASE_URL|REDIS_URL|MONGODB_URI|DSN)[A-Z0-9_]*=)([^\n]*)/gim;
const labeledSecretPattern = /((?:token|secret|api[_-]?key|password)\s*[:=]\s*)([^\s]+)/gim;
const bearerPattern = /(Bearer\s+)([^\s]+)/g;
const githubTokenPattern = /\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g;
const openAiTokenPattern = /\bsk-[A-Za-z0-9]{10,}\b/g;
const slackTokenPattern = /\bxox[baprs]-[A-Za-z0-9-]+\b/g;
const awsAccessKeyPattern = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g;
const jwtPattern = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const privateKeyPattern = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g;
const credentialUrlPattern = /([a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)([^\s@]+)(@)/gi;

export class LogRedactor {
  redact(text: string): string {
    return text
      .replace(envAssignmentPattern, (_, prefix: string) => `${prefix}${REDACTED}`)
      .replace(labeledSecretPattern, (_, prefix: string) => `${prefix}${REDACTED}`)
      .replace(bearerPattern, (_, prefix: string) => `${prefix}${REDACTED}`)
      .replace(githubTokenPattern, REDACTED)
      .replace(openAiTokenPattern, REDACTED)
      .replace(slackTokenPattern, REDACTED)
      .replace(awsAccessKeyPattern, REDACTED)
      .replace(jwtPattern, REDACTED)
      .replace(privateKeyPattern, REDACTED)
      .replace(
        credentialUrlPattern,
        (_, prefix: string, _password: string, suffix: string) => `${prefix}${REDACTED}${suffix}`,
      );
  }
}
