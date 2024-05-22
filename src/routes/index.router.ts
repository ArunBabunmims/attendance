import { Router } from 'express'
import baseRouter from './base.router'
import formARouter from './attendance.router'

const router = Router()

router.use('/', baseRouter)
router.use('/', formARouter)

export default router
