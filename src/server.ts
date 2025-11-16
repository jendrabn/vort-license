#!/usr/bin/env node

import http from 'http';
import debugFactory from 'debug';

import app from './app';
import env from './config/env';
import logger from './config/logger';

type Port = string | number;

const debug = debugFactory('vort-license:server');

const port = normalizePort(env.port);

if (port === false) {
  throw new Error('Invalid port specified');
}

app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: string): Port | false {
  const portNumber = parseInt(val, 10);

  if (Number.isNaN(portNumber)) {
    return val;
  }

  if (portNumber >= 0) {
    return portNumber;
  }

  return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();

  if (!addr) {
    return;
  }

  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  logger.info(`Listening on ${bind}`);
}
