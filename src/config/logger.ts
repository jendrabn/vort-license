import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';

import env from './env';

const logsDir = path.resolve(__dirname, '..', '..', 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    if (stack) {
      return `${timestamp} [${level}] ${message}\n${stack}${metaString}`;
    }
    return `${timestamp} [${level}] ${message}${metaString}`;
  })
);

const fileFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const logger = createLogger({
  level: env.logLevel,
  transports: [
    new transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: fileFormat
    }),
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: fileFormat
    }),
    new transports.Console({
      format: consoleFormat
    })
  ]
});

export default logger;
