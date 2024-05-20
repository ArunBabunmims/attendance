import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '@constants/http.constants'
import {
    assignFacultyRole,
    getAcadSessionByProgram,
    getAcadSessionBySubject,
    getProgramByAcadYearAndUsername,
    getSubjectsByProgram,
    getSubjectsByProgramAnalytics,
    getUserListCountForAssigningRole,
    getUserListForAssigningRole,
    getUserListForAssigningRoleForExcel,
} from '@model/master.model'

export async function programsByAcadYearAndUsername(req: Request, res: Response) {
    const { acadYear, campusLid } = req.query
    const { userSession } = res.locals

    const json = await getProgramByAcadYearAndUsername(
        acadYear as string,
        Number(userSession.user_detail.user_lid),
        userSession.user_detail.role, 
        Number(campusLid)
    )
    
    const data = json.map((val) => {
        return {
            value: val.id,
            label: `${val.program_name} - ${val.program_code}`,
            selected: false,
        }
    })
    return res.status(HTTP_STATUS.OK).json(data)
}

export async function subjectByProgram(req: Request, res: Response) {
    const { programLid, acadYear, acadSessionLid } = req.query

    
    const json = await getSubjectsByProgram(Number(programLid), Number(acadYear), Number(acadSessionLid))
    const data = json.map((val) => {
        return {
            value: val.id,
            label: `${val.subject_name} - ${val.subject_abbr} (${val.acad_year}) `,
            selected: false,
        }
    })

    return res.status(HTTP_STATUS.OK).json(data)
}

export async function subjectByProgramAnalytics(req: Request, res: Response) {
    const { programLid, acadYear } = req.query

    const json = await getSubjectsByProgramAnalytics(Number(programLid), Number(acadYear))

    const data = json.map((val) => {
        return {
            value: val.id,
            label: `${val.subject_name} - ${val.subject_abbr} (${val.acad_year}) `,
            selected: false,
        }
    })

    return res.status(HTTP_STATUS.OK).json(data)
}

export async function acadSessionByProgram(req: Request, res: Response) {
    const { programLid, acadYear } = req.query

    const json = await getAcadSessionByProgram(Number(programLid), Number(acadYear))

    const data = json.map((val) => {
        return {
            value: val.id,
            label: val.acad_session,
            selected: false,
        }
    })
    console.log('data in acadSessionByProgram::::: ', data)
    return res.status(HTTP_STATUS.OK).json(data)
}

export async function acadSessionBySubject(req: Request, res: Response) {
    const { subjectLid } = req.query

    const json = await getAcadSessionBySubject(Number(subjectLid))

    const data = json.map((val) => {
        return {
            value: val.id,
            label: val.acad_session,
            selected: false,
        }
    })

    return res.status(HTTP_STATUS.OK).json(data)
}

export async function userListToAssignFaculty(req: Request, res: Response) {
    const { limit, offset, search = '' } = req.query

    const { userSession } = res.locals

    const [data, count] = await Promise.all([
        getUserListForAssigningRole(
            Number(userSession.user_detail.user_lid),
            Number(limit),
            Number(offset),
            search as string,
            userSession.user_detail.role,
        ),
        getUserListCountForAssigningRole(userSession.user_detail.user_lid, userSession.user_detail.role),
    ])

    return res.status(HTTP_STATUS.OK).json({
        data: {
            items: data,
            total: count,
        },
    })
}

export async function assignMpcRole(req: Request, res: Response) {
    const { data } = req.body
    const { userSession } = res.locals

    console.log("DATA : ", data);
    console.log(" userSession.user_detail.user_lid : ",  userSession.user_detail.user_lid );
    console.log("userSession.user_detail.role : ", userSession.user_detail.role);
    
    const obj = await assignFacultyRole(data, userSession.user_detail.user_lid, userSession.user_detail.role)

    if (obj.status === 200) {
        return res.status(HTTP_STATUS.OK).json({
            status: 'SUCCESS',
            message: 'Roles Modified Successfully',
        })
    }

    return res.status(403).json({
        status: 'FORBIDDEN',
        message: obj.message ?? 'Something went wrong',
    })
}

export async function userToAssignRoleExcel(req: Request, res: Response) {
    const { userSession } = res.locals
    let json = await getUserListForAssigningRoleForExcel(userSession.user_detail.user_lid);
    return res.status(HTTP_STATUS.OK).json(json)
}
