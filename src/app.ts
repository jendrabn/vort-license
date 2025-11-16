import createError from 'http-errors';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import logger from './config/logger';
import adminAuthRouter from './routes/admin/auth.route';
import apiAuthRouter from './routes/api/auth.route';

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const viewsDir = path.join(rootDir, 'views');

const app = express();

// view engine setup
app.set('views', viewsDir);
app.set('view engine', 'ejs');

const httpLogger = morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
});

app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(publicDir));

app.use('/admin', adminAuthRouter);
app.use('/api', apiAuthRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((
  err: createError.HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Unhandled error for ${req.method} ${req.originalUrl}`, {
    status: err.status,
    stack: err.stack
  });
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
