import express, { Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { addChildLogger, addRequestId, requestLogger } from '@middleware/logger.middleware'
import { customErrorHandler } from '@middleware/error.middleware'
import router from '@routes/index.router'
import { main } from 'kafka'
import cron from "node-cron";
import { addSessionUserToRequest } from '@middleware/index.middleware'
import { logger } from '@config/logger'
import { notifyUsersForMeeting } from '@utils/scheduler'

const app: Express = express()
const PORT = process.env.PORT

app.use(express.json({
    limit: '200mb'
}))
app.use(express.urlencoded({ extended: true }))

app.use(cors({ 
      origin: true,
      credentials: true 
}))

// Request logger
app.use(addRequestId)
app.use(requestLogger)
app.use(addChildLogger)

app.use(cookieParser(process.env.COOKIE_SECRET))

//kafka client
// main().catch(err => console.log('Error in kafka consumer: ', err))

// Routes
app.use('/api', addSessionUserToRequest, router)

//error
app.use(customErrorHandler)

// Creating a cron job which runs everyday at 8am 
// cron.schedule("*/10 * * * * *", async function() { 
//     try {
//         await notifyUsersForMeeting() 
//     } catch (error) {
//         logger.error('Error in cron job: ', error)
//     }
// }); 

app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`)
})
