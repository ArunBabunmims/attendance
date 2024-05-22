import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '@constants/http.constants'
import {
    assignFacultyRole,
    getAcadSessionByProgram,
    getAcadSessionBySubject,
    getProgramByAcadYearAndUsername,
    getSubjectsByProgram,
    getSubjectsByProgramAnalytics,
    getFacultyAttendanceList,
    getCountFacultyAttendanceList,
    getAttendanceStudentList,
    getCountAttendanceStudentList,
    getSubmitStudentAttendance,
    getFacultyAttendanceListMarked,
    getAttendanceStudentListMarked,
    getFacultyAttendanceListApp,
    getFacultyAttendanceListAppNew,
    getSubmitStudentAttendanceApp,
    getUserListForAssigningRole,
    getUserListCountForAssigningRole,
    getUserListForAssigningRoleForExcel
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




// facultyAttendanceList


export async function facultyAttendanceList(req: Request, res: Response) {
    console.log("Heloooooooooooooooooooo");
    
    const { limit, offset, search = '' } = req.query

    const { userSession } = res.locals
    console.log("userSession::::::::::::", userSession);
    
    const [data, count] = await Promise.all([
        getFacultyAttendanceList(
            Number(userSession.user_detail.user_lid),
            Number(limit),
            Number(offset),
            search as string,
            userSession.user_detail.role,
        ),
        getCountFacultyAttendanceList(userSession.user_detail.user_lid, userSession.user_detail.role),
    ])

    return res.status(HTTP_STATUS.OK).json({
        data: {
            items: data,
            total: count,
        },
    })
}


export async function AttendanceStudentList(req: Request, res: Response) {
    console.log("ExterdXXXXXXXXXXXXXX", req.query);
    
    const { id = 0 } = {...req.query, ...req.params}

    console.log("attendanceIdXXXXXXX",id);
    
    const { limit, offset, search = '' } = req.query

    const { userSession } = res.locals

    console.log("userSession.user_detail.user_lidXXXX"+userSession.user_detail.user_lid);
    console.log("userSession.user_detail.roleXXXXXX"+userSession.user_detail.role);
    
    const data = await getAttendanceStudentList(
        Number(userSession.user_detail.user_lid),
        id,
    )

    return res.status(HTTP_STATUS.OK).json(data)
}



export async function SubmitStudentAttendance(req: Request, res: Response) {
    console.log("AttendanceXXXXXXXXXXXX");
    
    console.log("EnterAttendance", req.body);
    let StudentJson = req.body;

    const { userSession } = res.locals

    console.log("userSession.user_detail.user_lidXXXX"+userSession.user_detail.user_lid);
    console.log("userSession.user_detail.roleXXXXXX"+userSession.user_detail.role);

    const data = await getSubmitStudentAttendance(
        StudentJson,
        Number(userSession.user_detail.user_lid)
    )
    
    return res.status(HTTP_STATUS.OK).json(null)
}







export async function facultyAttendanceListMarked(req: Request, res: Response) {
    
    const { limit, offset, search = '' } = req.query

    const { userSession } = res.locals

    const [data, count] = await Promise.all([
        getFacultyAttendanceListMarked(
            Number(userSession.user_detail.user_lid),
            Number(limit),
            Number(offset),
            search as string,
            userSession.user_detail.role,
        ),
        getCountFacultyAttendanceList(userSession.user_detail.user_lid, userSession.user_detail.role),
    ])

    return res.status(HTTP_STATUS.OK).json({
        data: {
            items: data,
            total: count,
        },
    })
}



export async function AttendanceStudentListMarked(req: Request, res: Response) {
    console.log("ExterdXXXXXXXXXXXXXX", req.query);
    
    const { id = 0 } = {...req.query, ...req.params}

    console.log("attendanceIdXXXXXXX",id);
    
    const { limit, offset, search = '' } = req.query

    const { userSession } = res.locals

    console.log("userSession.user_detail.user_lidXXXX"+userSession.user_detail.user_lid);
    console.log("userSession.user_detail.roleXXXXXX"+userSession.user_detail.role);
    
    const data = await getAttendanceStudentListMarked(
        Number(userSession.user_detail.user_lid),
        id,
    )

    return res.status(HTTP_STATUS.OK).json(data)
}
export async function facultyAttendanceListApp(req: Request, res: Response) {
    
    const { userSession } = res.locals
    
    const data = await getFacultyAttendanceListAppNew(
        Number(userSession.user_detail.user_lid),
    )

    return res.status(HTTP_STATUS.OK).json(data)
}
export async function facultyAttendanceListAppNew(req: Request, res: Response) {
    
    const { userSession } = res.locals
    console.log("Arunnnnn");
    console.log("userSession.user_detail.user_lid",userSession.user_detail.user_lid);
    
    
    const data = await getFacultyAttendanceListAppNew(
        Number(userSession.user_detail.user_lid),
    )

    return res.status(HTTP_STATUS.OK).json(data)
}
export async function UpdatefacultyAttendanceListAppNew(req: Request, res: Response) {
    console.log("Arunnnnn");
    console.log("Dataaaaaaaaaaaaa",req.body);
    
    const { userSession } = res.locals
    console.log("EnterAttendance", req.body);
    let StudentJson = req.body;

    console.log("userSession.user_detail.user_lidXXXX"+userSession.user_detail.user_lid);
    

    const data = await getSubmitStudentAttendanceApp(
        StudentJson,
        Number(userSession.user_detail.user_lid)
    )

    return res.status(HTTP_STATUS.OK).json(data)
}