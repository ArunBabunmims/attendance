import { Request, Response } from 'express'
import { HTTP_STATUS } from '@constants/http.constants'
import {
    InsertMasterForm,
    deleteMasterForm,
    getAnchorsForMasterFormEdit,
    getAttendees,
    getAttendeesForMasterFormEdit,
    getCampusByUser,
    getCourseAnchor,
    getEmailBySessionLid,
    getMasterFormById,
    getMasterFormList,
    getMasterFormListByYearProgramSubject,
    getMasterFormListByYearProgramSubjectCount,
    getMasterFormListCount,
    getMeetingUsersByRole,
    getMeetingsbySubject,
    getProgramAnchor,
    updateMasterForm,
} from '@model/master.model'
import { masterFormInsertSchema } from '@validations/index.validations'
import { sendMPCMeetingMail } from '@utils/mpc.utils'

export async function programAnchor(req: Request, res: Response) {
    const { acadYear, programLid, subjectLid, acadSessionLid } = req.query

    const json = await getProgramAnchor(
        acadYear as string,
        Number(acadSessionLid),
        Number(programLid),
        Number(subjectLid),
    )

    const data = json.map((val) => {
        return {
            value: val.user_session_lid,
            label: `${val.first_name} ${val.last_name} (${val.username}) - (${val.campus_abbr})`,
            selected: true,
        }
    })

    res.status(HTTP_STATUS.OK).json(data)
}

export async function courseAnchor(req: Request, res: Response) {
    const { acadYear, programLid, subjectLid, acadSessionLid } = req.query

    const json = await getCourseAnchor(
        acadYear as string,
        Number(acadSessionLid),
        Number(programLid),
        Number(subjectLid),
    )

    const data = json.map((val) => {
        return {
            value: val.user_session_lid,
            label: `${val.first_name} ${val.last_name} (${val.username}) - (${val.campus_abbr})`,
            selected: true,
        }
    })

    res.status(HTTP_STATUS.OK).json(data)
}

export async function attendeesForMeeting(req: Request, res: Response) {
    const { acadYear, programLid, subjectLid, acadSessionLid } = req.query

    const json = await getAttendees(acadYear as string, Number(acadSessionLid), Number(programLid), Number(subjectLid))

    const data = json.map((val) => {
        return {
            value: val.user_session_lid,
            label: `${val.first_name} ${val.last_name} (${val.username}) - (${val.campus_abbr})`,
            selected: true,
        }
    })

    res.status(HTTP_STATUS.OK).json(data)
}

export async function programAndCourseAnchor(req: Request, res: Response) {
    const { acadYear, programLid, subjectLid, acadSessionLid } = req.query

    const [courseAnchors, programAnchors] = await Promise.all([
        getCourseAnchor(acadYear as string, Number(acadSessionLid), Number(programLid), Number(subjectLid)),
        getProgramAnchor(acadYear as string, Number(acadSessionLid), Number(programLid), Number(subjectLid)),
    ])

    const json = {
        program_anchor: programAnchors,
        course_anchor: courseAnchors,
    }

    return res.status(HTTP_STATUS.OK).json(json)
}

export async function masterFormList(req: Request, res: Response) {
    const { limit, offset, search = '' } = req.query
    const { userSession } = res.locals

    const [data, count] = await Promise.all([
        getMasterFormList(
            userSession.user_detail.user_lid,
            Number(limit),
            Number(offset),
            search as string,
            userSession.user_detail.role,
        ),
        getMasterFormListCount(userSession.user_detail.user_lid, userSession.user_detail.role),
    ])

    return res.status(HTTP_STATUS.OK).json({
        data: {
            items: data,
            total: count,
        },
    })
}

export async function masterFormByYearProgramSubject(req: Request, res: Response) {
    const { acadYear, programLid, subjectLid, limit, offset, search = '' } = req.query
    const { userSession } = res.locals

    const [data, count] = await Promise.all([
        getMasterFormListByYearProgramSubject(
            userSession.user_detail.user_lid,
            Number(acadYear),
            Number(programLid),
            Number(subjectLid),
            Number(limit),
            Number(offset),
            search as string,
            userSession.user_detail.role,
        ),
        getMasterFormListByYearProgramSubjectCount(
            userSession.user_detail.user_lid,
            Number(acadYear),
            Number(programLid),
            Number(subjectLid),
            userSession.user_detail.role,
        ),
    ])

    return res.status(HTTP_STATUS.OK).json({
        data: {
            items: data,
            total: count,
        },
    })
}

export async function masterFormById(req: Request, res: Response) {
    const { masterFormId } = req.query

    const masterFormData = await getMasterFormById(Number(masterFormId))
    const masterFormusersData = await getMeetingUsersByRole(Number(masterFormId))

    res.status(HTTP_STATUS.OK).json({
        master_data: masterFormData[0],
        master_form_users: masterFormusersData,
    })
}

export async function meetingUserByRole(req: Request, res: Response) {
    const { masterFormId } = req.query

    const data = await getMeetingUsersByRole(Number(masterFormId))

    res.status(HTTP_STATUS.OK).json({
        data,
    })
}

export async function masterFormInsert(req: Request, res: Response) {
    const body = req.body
    const json = masterFormInsertSchema.parse({ body })
    const { userSession } = res.locals

    console.log("masterFormInsert schema : " + JSON.stringify(json));
    
    const data = await InsertMasterForm(json, userSession.user_detail.user_lid)
    // sendMPCMeetingMail(json);
    return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS[data.status],
        message: data.message,
    })
}

export async function masterFormDelete(req: Request, res: Response) {
    const { masterFormId } = req.query
    const { userSession } = res.locals

    const data = await deleteMasterForm(Number(masterFormId), userSession.user_detail.user_lid)

    return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS[data.status],
        message: data.message,
    })
}

export async function masterFormEdit(req: Request, res: Response) {
    const body = req.body
    const { userSession } = res.locals

    const data = await updateMasterForm(body, userSession.user_detail.user_lid)

    return res.status(HTTP_STATUS.OK).json({
        status: HTTP_STATUS[data.status],
        message: data.message,
    })
}

export async function usersForMasterFormEdit(req: Request, res: Response) {
    const { masterFormId } = req.query

    const anchors = await getAnchorsForMasterFormEdit(Number(masterFormId))
    const attendees = await getAttendeesForMasterFormEdit(Number(masterFormId))
    const data = { ...anchors, attendees: [...attendees] }
    res.status(HTTP_STATUS.OK).json(data)
}

export async function meetingsBySubject(req: Request, res: Response) {
    const { subjectLid, acadYear, programLid } = req.query

    const meetings = await getMeetingsbySubject(Number(subjectLid), acadYear as string, Number(programLid))
    res.status(HTTP_STATUS.OK).json(meetings)
}

export async function campusByUser(req: Request, res: Response) {

    const { userSession } = res.locals
    const campusList = await getCampusByUser(userSession.user_detail.user_lid);
    console.log("Campus list: ", campusList);
    
    res.status(HTTP_STATUS.OK).json(campusList)
}
