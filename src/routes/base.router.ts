import {UpdatefacultyAttendanceListAppNew,facultyAttendanceListAppNew,facultyAttendanceListApp,facultyAttendanceList,AttendanceStudentList,SubmitStudentAttendance,facultyAttendanceListMarked,AttendanceStudentListMarked, programsByAcadYearAndUsername, subjectByProgram, assignMpcRole, acadSessionBySubject, acadSessionByProgram, subjectByProgramAnalytics, userListToAssignFaculty, userToAssignRoleExcel } from '@controller/base.controller'
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



// ArunB
// faculty-attendance-list
baseRouter.get('/faculty-attendance-list', asyncErrorHandler(facultyAttendanceList))
baseRouter.get('/get-attendance-studentList', asyncErrorHandler(AttendanceStudentList))
baseRouter.post('/submit-student-attendance', asyncErrorHandler(SubmitStudentAttendance))
baseRouter.get('/faculty-attendance-list-marked', asyncErrorHandler(facultyAttendanceListMarked))
baseRouter.get('/get-attendance-studentList-marked', asyncErrorHandler(AttendanceStudentListMarked))


baseRouter.get('/faculty-attendance-list-app', asyncErrorHandler(facultyAttendanceListApp))
baseRouter.get('/faculty-attendance-list-app-new', asyncErrorHandler(facultyAttendanceListAppNew))
baseRouter.post('/update-faculty-attendance-list-app', asyncErrorHandler(UpdatefacultyAttendanceListAppNew))
export default baseRouter
