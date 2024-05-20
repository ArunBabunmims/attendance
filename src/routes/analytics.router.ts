import { absenteesCountForChart, getFormBAnalyticsNew, mpcSchoolList, programFormbAnalytics, programsByAcadYearAndUsernameAndOrganization } from '@controller/analytics.controller';
import { asyncErrorHandler } from '@middleware/error.middleware';
import { Router } from 'express'

const analyticsRouter = Router();

analyticsRouter.get('/mpc-school-list', asyncErrorHandler(mpcSchoolList));
analyticsRouter.get(
    '/program-by-username-and-year-and-organization',
    asyncErrorHandler(programsByAcadYearAndUsernameAndOrganization),
)
analyticsRouter.get('/get-program-formB-for-analytics', asyncErrorHandler(programFormbAnalytics))
analyticsRouter.get('/get-absentees-count', asyncErrorHandler(absenteesCountForChart))
analyticsRouter.get('/get-form-b-analytics-new', asyncErrorHandler(getFormBAnalyticsNew));


export default analyticsRouter;