import { formASummary, getFormB , submitFormB, formBList, formBById, getFormBWrite, getFormBRead, getFormBAnalytics, meetingCountByProgram, subjectByProgramSession } from '@controller/formB.controller';
import { asyncErrorHandler } from '@middleware/error.middleware'
import { Router } from 'express';


const formBRouter = Router();


formBRouter.get('/get-form-a-summary', asyncErrorHandler(formASummary));
formBRouter.get('/get-form-b', asyncErrorHandler(getFormB));
formBRouter.get('/get-form-b-write', asyncErrorHandler(getFormBWrite));
formBRouter.get('/get-form-b-read', asyncErrorHandler(getFormBRead));
formBRouter.get('/get-form-b-analytics', asyncErrorHandler(getFormBAnalytics));
formBRouter.post('/submit-formB', asyncErrorHandler(submitFormB));
formBRouter.get('/formB-list', asyncErrorHandler(formBList));
formBRouter.get('/get-formB-detail-by-id', asyncErrorHandler(formBById));
formBRouter.get('/get-count-by-program', asyncErrorHandler(meetingCountByProgram));
formBRouter.get('/subject-by-program-session', asyncErrorHandler(subjectByProgramSession));

export default formBRouter;