import { Router } from 'express'
import baseRouter from './base.router'
import masterRouter from './master.router'
import formARouter from './formA.router'
import formBRouter from './formB.router'
import analyticsRouter from './analytics.router'

const router = Router()

router.use('/', baseRouter)
router.use('/', masterRouter)
router.use('/', formARouter)
router.use('/', formBRouter)
router.use('/', analyticsRouter)

export default router
