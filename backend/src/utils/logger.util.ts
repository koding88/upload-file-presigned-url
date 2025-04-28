import { createLogger, format, transports } from "winston";
import path from "path";
import fs from "fs";
const { combine, timestamp, printf } = format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Get current date for folder name
const getCurrentDateFolder = () => {
    const date = new Date();
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
};

// Create daily folder if it doesn't exist
const dailyFolder = path.join(logDir, getCurrentDateFolder());
if (!fs.existsSync(dailyFolder)) {
    fs.mkdirSync(dailyFolder, { recursive: true });
}

export const logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        timestamp({
            format: "DD-MM-YYYY HH:mm:ss",
        }),
        logFormat
    ),
    transports: [
        new transports.File({
            filename: path.join(dailyFolder, "error.log"),
            level: "error",
        }),
        new transports.File({
            filename: path.join(dailyFolder, "app.log"),
        }),
        new transports.Console({
            format: combine(format.colorize(), format.simple()),
        }),
    ],
});
