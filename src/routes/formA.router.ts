import { attendeesByMeetingID, formA, formADetail, formAList, getFormACountAndCourseAnchor, getFormACountAndCourseAnchorByID, meetingDateForFormA, submitFormA } from '@controller/formA.controller';
import { asyncErrorHandler, validate } from '@middleware/error.middleware'
import { Router } from 'express'

const formARouter = Router();

formARouter.get('/get-formA-meeting-date', asyncErrorHandler(meetingDateForFormA));
formARouter.get('/get-attendees-by-meetingId', asyncErrorHandler(attendeesByMeetingID));
formARouter.get('/get-formA', asyncErrorHandler(formA));
formARouter.post('/submit-formA', asyncErrorHandler(submitFormA));
formARouter.get('/formA-list', asyncErrorHandler(formAList));
formARouter.get('/get-formA-detail', asyncErrorHandler(formADetail));
formARouter.get('/get-count-and-ac', asyncErrorHandler(getFormACountAndCourseAnchor));
formARouter.get('/get-count-and-by-id', asyncErrorHandler(getFormACountAndCourseAnchorByID));

export default formARouter;