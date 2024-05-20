import { HTTP_STATUS } from '@constants/http.constants'
import {
    getFormBData,
    getFormASummary,
    insertFormB,
    getFormBList,
    getFormBListCount,
    getFormBDetails,
    formBHeaderWrite,
    formBvalueWrite,
    formBHeaderRead,
    formBvalueRead,
    formBHeaderAnalytics,
    formBvalueAnalytics,
    meetingCountByProgramModel,
    subjectByProgramSessionModel,
} from '@model/formB.model'
import { groupByPoint } from '@utils/mpc.utils'
import { Request, Response } from 'express'

export async function formASummary(req: Request, res: Response) {
    const { acadYear, program, acadSession } = req.query
    const json = await getFormASummary(acadYear as string, Number(program), Number(acadSession))

    res.status(HTTP_STATUS.OK).json(json)
}

export async function getFormB(req: Request, res: Response) {
    const { acadYear, program, acadSession } = req.query

    const [formASummary, formBData] = await Promise.all([
        getFormASummary(acadYear as string, Number(program), Number(acadSession)),
        getFormBData(acadYear as string, Number(program), Number(acadSession)),
    ])

    const formBDataAltered = formBData.map((data) => {
        if (data.abbr === 'number_of_meetings_count') {
            data.text = String(data.text?.split(',').length ?? '')
        }
        return data
    })

    const data = groupByPoint(formBDataAltered)

    res.status(HTTP_STATUS.OK).json({
        formASummary,
        formBData: formBDataAltered,
        groupedData: data,
    })
}

export async function submitFormB(req: Request, res: Response) {
    const submitBody = req.body
    const { userSession } = res.locals

    const json = await insertFormB(submitBody, userSession.user_detail.user_lid)

    res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS[json.status],
        message: json.message,
    })
}

export async function formBList(req: Request, res: Response) {
    const { limit, offset, search = '' } = req.query

    const { userSession } = res.locals

    const [data, count] = await Promise.all([
        getFormBList(
            Number(limit),
            Number(offset),
            search as string,
            userSession.user_detail.user_lid,
            userSession.user_detail.role,
        ),
        getFormBListCount(userSession.user_detail.user_lid, userSession.user_detail.role),
    ])

    return res.status(HTTP_STATUS.OK).json({
        data: {
            items: data,
            total: count,
        },
    })
}

export async function formBById(req: Request, res: Response) {
    const { acadYear, sessionLid, programLid, subjectLid } = req.query

    const formDetails = await getFormBDetails(acadYear as string, Number(sessionLid), Number(programLid))
    const formBData = await getFormBData(acadYear as string, Number(programLid), Number(sessionLid))

    const formBDataAltered = formBData.map((data) => {
        if (data.abbr === 'number_of_meetings_count') {
            data.text = String(data.text?.split(',').length ?? '')
        }
        return data
    })

    const data = groupByPoint(formBDataAltered)

    res.status(HTTP_STATUS.OK).json({
        formDetails: formDetails,
        formBData: formBDataAltered,
        groupedData: data,
        subjectLid
    })
}

export async function getFormBWrite(req: Request, res: Response) {
    const { acadYear, program, acadSession,subjectLid } = req.query;
    const { userSession } = res.locals

    let formBHeaderData = await formBHeaderWrite(acadYear as string, Number(program), Number(acadSession),userSession.user_detail.user_lid, Number(subjectLid));
    let formBvalueData = await formBvalueWrite(acadYear as string, Number(program), Number(acadSession),userSession.user_detail.user_lid, Number(subjectLid));

    console.log("formBvalueData : ",formBvalueData);
    
    res.status(HTTP_STATUS.OK).json({formBHeaderData,formBvalueData});
}

export async function getFormBRead(req: Request, res: Response) {
    const { acadYear, program, acadSession } = req.query;
    console.log("IN READ : ",{ acadYear, program, acadSession });
    
    let formBHeaderData = await formBHeaderRead(acadYear as string, Number(program), Number(acadSession));
    let formBvalueData = await formBvalueRead(acadYear as string, Number(program), Number(acadSession));

    console.log("formBvalueData : ",formBvalueData);
    
    res.status(HTTP_STATUS.OK).json({formBHeaderData,formBvalueData});
}

export async function getFormBAnalytics(req: Request, res: Response) {
    const { acadYear, program} = req.query;

    let formBHeaderData = await formBHeaderAnalytics(acadYear as string, Number(program));
    let formBvalueData = await formBvalueAnalytics(acadYear as string, Number(program));

    console.log("formBvalueData : ",formBvalueData);
    
    res.status(HTTP_STATUS.OK).json({formBHeaderData,formBvalueData});
}

export async function meetingCountByProgram(req: Request, res: Response) {
    const {program, acadYear} = req.query;

    let Meetcount = await meetingCountByProgramModel(acadYear as string,Number(program));
    res.status(HTTP_STATUS.OK).json({Meetcount});
}

export async function subjectByProgramSession(req: Request, res: Response) {
    const {programLid, acadYear, acadSession} = req.query;

    let json = await subjectByProgramSessionModel(acadYear as string,Number(programLid), Number(acadSession));
    return res.status(HTTP_STATUS.OK).json(json)
}
