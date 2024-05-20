import postgres from 'postgres'
import { logger } from './logger'

const sql = postgres({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    debug(_, query, parameters, paramTypes) {
        logger.info('Executing query:::', {
            query: query,
            parameters: parameters,
            paramTypes: paramTypes,
        })
    },
})

export default sql
