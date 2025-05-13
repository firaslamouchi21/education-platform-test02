const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logging
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define where to store log files
const transports = [
  // Write all logs with level 'error' and below to 'error.log'
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error'
  }),
  // Write all logs with level 'info' and below to 'combined.log'
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log')
  })
];

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports
});

// Create a stream object for Morgan HTTP logging
const stream = {
  write: (message) => logger.http(message.trim())
};

module.exports = {
  logger,
  stream
}; 