import winston from 'winston'

// Define log levels and colors
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
}

const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
}

// Create a Winston logger
const logger = winston.createLogger({
    levels: logLevels,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.prettyPrint({
                    colorize: true,
                    depth: 5,
                }),
            ),
        }),
        new winston.transports.File({
            level: 'error',
            filename: process.env.LOG_DIR + 'error.log',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.prettyPrint({
                    colorize: true,
                    depth: 5,
                }),
            ),
        }),
        new winston.transports.File({
            level: 'info',
            filename: process.env.LOG_DIR + 'info.log',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.prettyPrint({
                    colorize: true,
                    depth: 5,
                }),
            ),
        }),
        // new ElasticsearchTransport({
        //     level: 'info',
        //     clientOpts: {
        //         node: process.env.ELASTICSEARCH_URL,
        //         auth: {
        //             username: process.env.ELASTICSEARCH_USERNAME!,
        //             password: process.env.ELASTICSEARCH_PASSWORD!,
        //         },
        //     },
        // }),
    ],
})

// Add colors to the logger
winston.addColors(logColors)

export { logger }
