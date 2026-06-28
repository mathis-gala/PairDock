const command = process.argv[2] ?? 'start';

const handlers: Record<string, () => void> = {
  login: () => {
    console.log('PairDock agent skeleton login: configure backend URL and token storage.');
  },
  start: () => {
    console.log('PairDock agent skeleton start: websocket client not implemented yet.');
  },
  status: () => {
    console.log('PairDock agent skeleton status: idle.');
  },
  stop: () => {
    console.log('PairDock agent skeleton stop: nothing to clean up yet.');
  },
};

const handler = handlers[command];

if (!handler) {
  console.error(`Unknown pairdock-agent command: ${command}`);
  process.exitCode = 1;
} else {
  handler();
}
