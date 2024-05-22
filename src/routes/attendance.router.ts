import { asyncErrorHandler, validate } from '@middleware/error.middleware'
import baseRouter from './base.router';
import { AttendanceStudentList, AttendanceStudentListMarked, SubmitStudentAttendance, UpdatefacultyAttendanceListAppNew, facultyAttendanceList, facultyAttendanceListApp, facultyAttendanceListAppNew, facultyAttendanceListMarked } from '@controller/attendance.controller';




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

export default baseRouter;