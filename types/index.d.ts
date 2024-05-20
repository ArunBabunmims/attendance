import { Logger } from 'winston'
import { UserSessionData } from './redis'

declare global {
    namespace Express {
        interface Locals {
            requestId: string
            logger: Logger
            userSession: UserSessionData
        }
    }
}
