import { Request, Response } from 'express'
import { HTTP_STATUS } from '@constants/http.constants'
import {
    formBHeaderAnalyticsNew,
    formBvalueAnalyticsNew,
    getAbsenteesCountForChart,
    getAnalyticsChartForICA,
    getFormBDataForAnalytics,
    getFormBDetailsForAnalytics,
    getMpcSchoolList,
    getprogramsByAcadYearAndUsernameAndOrganizationAbbr,
} from '@model/analytics.model'
import { groupByPoint } from '@utils/mpc.utils'
import { formBvalueAnalytics } from '@model/formB.model'

export async function mpcSchoolList(req: Request, res: Response) {
    const { userSession } = res.locals

    const meetings = await getMpcSchoolList(userSession.user_detail.user_lid, userSession.user_detail.role)
    console.log('meetings::::: ', meetings)

    return res.status(HTTP_STATUS.OK).json(meetings)
}

export async function programsByAcadYearAndUsernameAndOrganization(req: Request, res: Response) {
    const { acadYear, organizationAbbr } = req.query
    const { userSession } = res.locals

    console.log("programsByAcadYearAndUsernameAndOrganization : ",userSession.user_detail.role);
    
    const json = await getprogramsByAcadYearAndUsernameAndOrganizationAbbr(
        acadYear as string,
        userSession.user_detail.user_lid,
        organizationAbbr as string,
        userSession.user_detail.role
    )
    const data = json.map((val) => {
        return {
            value: val.id,
            label: ` ${val.program_name} - ${val.program_code} (${val.program_id})`,
            selected: false,
        }
    })
    return res.status(HTTP_STATUS.OK).json(data)
}

export async function programFormbAnalytics(req: Request, res: Response) {
    const { acadYear, programLid } = req.query

    const formDetails = await getFormBDetailsForAnalytics(acadYear as string, Number(programLid))
    const formBData = await getFormBDataForAnalytics(acadYear as string, Number(programLid))
    const icaChart = await getAnalyticsChartForICA(acadYear as string, Number(programLid))

    const formBDataAltered = formBData.map((data) => {
        if (data.abbr === 'number_of_meetings_count') {
            data.text = String(data.text?.split(',').length ?? '')
        }
        return data
    })

    const data = groupByPoint(formBDataAltered)

    return res.status(HTTP_STATUS.OK).json({
        formDetails: formDetails,
        formBData: formBDataAltered,
        groupedData: data,
        icaChartData: Number(Number(icaChart).toFixed(2)),
    })
}

export async function absenteesCountForChart(req: Request, res: Response) {
    const { acadYear, subjectLid, programLid } = req.query

    const json = await getAbsenteesCountForChart(acadYear as string, Number(programLid), Number(subjectLid))
    return res.status(HTTP_STATUS.OK).json(json)
}

export async function getFormBAnalyticsNew(req: Request, res: Response) {
    const { acadYear, program,subjectLid } = req.query;
    const { userSession } = res.locals

    console.log("getFormBAnalyticsNew : ",{acadYear, program, subjectLid});
    
    let formBHeaderData = await formBHeaderAnalyticsNew(acadYear as string, Number(program),userSession.user_detail.user_lid, Number(subjectLid));
    let formBvalueData = await formBvalueAnalyticsNew(acadYear as string, Number(program),userSession.user_detail.user_lid, Number(subjectLid));

    
    res.status(HTTP_STATUS.OK).json({formBHeaderData,formBvalueData});
}
