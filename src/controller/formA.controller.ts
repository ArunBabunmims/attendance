import { Request, Response } from 'express'
import { HTTP_STATUS } from '@constants/http.constants'
import { getMeetingUsersByRole } from '@model/master.model'
import {
    getAttendeesByMeetingID,
    getFormA,
    getFormAList,
    getFormAListCount,
    getFormAdetail,
    getMeetingCountAndCourseAncor,
    getMeetingCountAndCourseAncorByID,
    getMeetingDateForFormA,
    insertFromA,
} from '@model/formA.model'
import { groupByPointFormA } from '@utils/mpc.utils'
import { Point } from 'types/mpc'
import { countCourse } from 'types/user'

export async function meetingDateForFormA(req: Request, res: Response) {
    const { acadYear, programLid, subjectLid, acadSessionLid } = req.query
    const { userSession } = res.locals

    console.log("meetingDateForFormA Called");

    const json = await getMeetingDateForFormA(
        acadYear as string,
        Number(acadSessionLid),
        Number(programLid),
        Number(subjectLid),
        userSession.user_detail.user_lid,
    )

    console.log("meetingDateForFormA : ", json);
    

    const data = json.map((val) => {
        return {
            value: val.meeting_id,
            label: `${val.meeting_date} - ${val.meeting_name}`,
            selected: false,
        }
    })

    return res.status(HTTP_STATUS.OK).json(data)
}

export async function attendeesByMeetingID(req: Request, res: Response) {
    const { meetingId } = req.query

    const json = await getAttendeesByMeetingID(Number(meetingId))

    const data = json.map((val) => {
        return {
            value: val.user_session_lid,
            label: `${val.first_name} ${val.last_name} (${val.username})`,
            selected: true,
        }
    })

    return res.status(HTTP_STATUS.OK).json(data)
}

export async function formA(req: Request, res: Response) {
    const { meetingId } = req.query

    const json = await getFormA(Number(meetingId))
    json.header.unshift({ id: 1, name: 'Points' }, { id: 2, name: 'Sub-Points' })

    const uniquePoints = json.points.reduce((acc: any, point) => {
        if (!acc[point.id]) {
            acc[point.id] = { id: point.id, point: point.point, subPoint: point.subPoint, type: point.type };
        }
        return acc;
    }, {});

    console.log("UNIQUE POINTS::::::::::::::", uniquePoints);

    const normalJson = {
        "header": json.header,
        "points": Object.values(uniquePoints)
    };

    json.points = groupByPointFormA(json)

    return res.status(HTTP_STATUS.OK).json({
        groupedJson: json,
        json: normalJson,
    })
}

export async function submitFormA(req: Request, res: Response) {
    const submitBody = req.body
    const { userSession } = res.locals

    const json = await insertFromA(submitBody, userSession.user_detail.user_lid)

    if (json.status !== 200) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(json)
    }
    return res.status(HTTP_STATUS.OK).json(json)
}

export async function formAList(req: Request, res: Response) {
    const { limit, offset, search = '' } = req.query
    const { userSession } = res.locals

    const [data, count] = await Promise.all([
        getFormAList(
            Number(limit),
            Number(offset),
            search as string,
            userSession.user_detail.user_lid,
            userSession.user_detail.role,
        ),
        getFormAListCount(userSession.user_detail.user_lid, userSession.user_detail.role),
    ])

    return res.status(HTTP_STATUS.OK).json({
        data: {
            items: data,
            total: count,
        },
    })
}

export async function formADetail(req: Request, res: Response) {
    const { meetingId } = req.query

    const [formADetail, meetingUsers] = await Promise.all([
        getFormAdetail(Number(meetingId)),
        getMeetingUsersByRole(Number(meetingId)),
    ])

    formADetail.header.unshift({ id: 1, name: 'Points' }, { id: 2, name: 'Sub-Points' })
    console.log('formADetail::::: ', formADetail)
    const attendees = meetingUsers.attendees ? meetingUsers.attendees : []
    const absentees = meetingUsers.absentees ? meetingUsers.absentees : []
    const json = {
        ...formADetail,
        attendees: [...attendees],
        absentees: [...absentees],
    }

    const normalJson = Object.assign({}, json)

    json.points = groupByPointFormA(json)

    res.status(HTTP_STATUS.OK).json({
        groupedJson: json,
        json: normalJson,
    })
}

export async function getFormACountAndCourseAnchor(req: Request, res: Response) {
    const { meetingId } = req.query

    let json = await getMeetingCountAndCourseAncor(Number(meetingId));
    console.log("getFormACountAndCourseAnchor :", json);
    
    return res.status(HTTP_STATUS.OK).json(json)
}

export async function getFormACountAndCourseAnchorByID(req: Request, res: Response) {
    const { meetingLid } = req.query

    console.log("meetingLid:::::::::::::::::::::", meetingLid);
    
    let json = await getMeetingCountAndCourseAncorByID(Number(meetingLid));
    console.log("getFormACountAndCourseAnchorByID :", json);
    
    return res.status(HTTP_STATUS.OK).json(json)
}
