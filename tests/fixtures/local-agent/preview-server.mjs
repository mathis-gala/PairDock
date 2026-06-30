#!/usr/bin/env node
import { createServer } from 'node:http';

const port = Number(process.argv[2] ?? '3100');

const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(`preview:${process.cwd()}`);
});

server.listen(port, '127.0.0.1');

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
