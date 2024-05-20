import {
    courseAnchor,
    masterFormList,
    programAnchor,
    programAndCourseAnchor,
    masterFormByYearProgramSubject,
    masterFormById,
    meetingUserByRole,
    attendeesForMeeting,
    masterFormInsert,
    masterFormDelete,
    masterFormEdit,
    usersForMasterFormEdit,
    meetingsBySubject,
    campusByUser,
} from '@controller/master.controller'
import { asyncErrorHandler, validate } from '@middleware/error.middleware'
import { masterFormInsertSchema } from '@validations/index.validations'
import { Router } from 'express'

const masterRouter = Router()

masterRouter.get('/program-anchor', asyncErrorHandler(programAnchor))
masterRouter.get('/course-anchor', asyncErrorHandler(courseAnchor))
masterRouter.get('/attendees', asyncErrorHandler(attendeesForMeeting))
masterRouter.get('/program-and-course-anchor', asyncErrorHandler(programAndCourseAnchor))
masterRouter.post('/master-form', asyncErrorHandler(validate(masterFormInsertSchema)), asyncErrorHandler(masterFormInsert))
masterRouter.get('/master-form-list', asyncErrorHandler(masterFormList))
masterRouter.get('/master-form-list-by-subject', asyncErrorHandler(masterFormByYearProgramSubject))
masterRouter.get('/master-form-by-id', asyncErrorHandler(masterFormById))
masterRouter.get('/form-users-by-meeting-id', asyncErrorHandler(meetingUserByRole))
masterRouter.delete('/master-form', asyncErrorHandler(masterFormDelete))
masterRouter.put('/master-form', asyncErrorHandler(masterFormEdit))
masterRouter.get('/users-for-master-form-edit', asyncErrorHandler(usersForMasterFormEdit))
masterRouter.get('/meetings-by-subject', asyncErrorHandler(meetingsBySubject))
masterRouter.get('/campus-by-user', asyncErrorHandler(campusByUser))


export default masterRouter