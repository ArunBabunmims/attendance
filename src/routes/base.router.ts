import { programsByAcadYearAndUsername, subjectByProgram, userListToAssignFaculty, assignMpcRole, acadSessionBySubject, acadSessionByProgram, subjectByProgramAnalytics, userToAssignRoleExcel } from '@controller/base.controller'
import { asyncErrorHandler, validate } from '@middleware/error.middleware'
import { programsByAcadYearSchema, subjectByProgramSchema } from '@validations/index.validations'
import { Router } from 'express'

const baseRouter = Router()

baseRouter.get(
    '/program-by-username-and-year',
    asyncErrorHandler(validate(programsByAcadYearSchema)),
    asyncErrorHandler(programsByAcadYearAndUsername),
)
baseRouter.get(
    '/subject-by-program',
    asyncErrorHandler(validate(subjectByProgramSchema)),
    asyncErrorHandler(subjectByProgram),
)
baseRouter.get('/subject-by-program-analytic', asyncErrorHandler(subjectByProgramAnalytics))
baseRouter.get('/acad-session-by-program', asyncErrorHandler(acadSessionByProgram))
baseRouter.get('/acad-session-by-subject', asyncErrorHandler(acadSessionBySubject))
baseRouter.get('/user-to-assign-role', asyncErrorHandler(userListToAssignFaculty))
baseRouter.post('/assign-role', asyncErrorHandler(assignMpcRole))
baseRouter.post('/meeting-count-by-program', asyncErrorHandler(assignMpcRole))
baseRouter.get('/user-to-assign-role-excel', asyncErrorHandler(userToAssignRoleExcel))
export default baseRouter
