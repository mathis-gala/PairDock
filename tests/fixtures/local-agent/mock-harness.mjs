#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const [, , prompt = '', modelId = '', reasoningEffort = ''] = process.argv;

if (prompt.startsWith('record-cwd:')) {
  const markerName = prompt.slice('record-cwd:'.length);
  await writeFile(markerName, process.cwd(), 'utf8');
  process.stdout.write(`cwd:${process.cwd()}\n`);
  process.exit(0);
}

if (prompt === 'stream-output') {
  process.stdout.write('stdout:first chunk\n');
  await delay(250);
  process.stderr.write('stderr:second chunk\n');
  await delay(50);
  process.exit(0);
}

if (prompt === 'wait-for-cancel') {
  process.stdout.write('stdout:started\n');
  setInterval(() => {
    process.stdout.write('stdout:still-running\n');
  }, 1000);
} else {
  process.stdout.write(`prompt:${prompt}\n`);
  process.stderr.write(`model:${modelId}\n`);
  process.stderr.write(`reasoning:${reasoningEffort}\n`);
  process.exit(0);
}
