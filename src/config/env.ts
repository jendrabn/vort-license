import path from 'path';
import { config } from 'dotenv';

const rootDir = path.resolve(__dirname, '..', '..');

config({
  path: path.join(rootDir, '.env')
});

const resolvedPort = process.env.PORT ?? '3000';

interface MailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
}

interface AppEnv {
  nodeEnv: string;
  port: string;
  logLevel: string;
  jwtSecret: string;
  appUrl: string;
  encryptionKey: string;
  mail: MailConfig;
}

const env: AppEnv = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: resolvedPort,
  logLevel: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  jwtSecret: process.env.JWT_SECRET ?? '',
  appUrl: process.env.APP_URL ?? `http://localhost:${resolvedPort}`,
  encryptionKey: process.env.ENCRYPTION_KEY ?? '',
  mail: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM
  }
};

export default env;
