/**
 * A simple logger utility that controls console output based on environment
 * In production, only errors will be logged, while in development all logs are shown
 */

const isProd = process.env.NODE_ENV === "production";

/**
 * Logger utility with environment-aware methods
 */
const logger = {
    /**
     * Log info messages (only in development)
     */
    log: (...args: unknown[]) => {
        if (!isProd) {
            console.log(...args);
        }
    },

    /**
     * Log warning messages (only in development)
     */
    warn: (...args: unknown[]) => {
        if (!isProd) {
            console.warn(...args);
        }
    },

    /**
     * Log error messages (in all environments)
     */
    error: (...args: unknown[]) => {
        console.error(...args);
    },
};

export default logger;
