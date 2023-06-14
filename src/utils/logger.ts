import winston from 'winston';

const { format } = winston;

const myFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
  }),
);

const logger = winston.createLogger({
  level: 'info',
  format: myFormat,
  transports: [
    new winston.transports.Console({
      format: format.combine(myFormat, format.colorize()),
    }),
  ],
});

export { logger };
