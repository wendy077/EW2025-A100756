const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
fs.ensureDirSync(logDir);

// Pretty console format
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// File format (structured for processing)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: 'info',
  transports: [
    // Console output
    new winston.transports.Console({
      format: consoleFormat
    }),

    // File output with daily rotation
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '10m',
      maxFiles: '14d',
      format: fileFormat
    })
  ]
});

module.exports = logger;
