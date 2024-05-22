import { Request, Response } from 'express'
import { HTTP_STATUS } from '@constants/http.constants'
 
import { getAttendanceStudentList, getAttendanceStudentListMarked, getCountFacultyAttendanceList, getFacultyAttendanceList, getFacultyAttendanceListAppNew, getFacultyAttendanceListMarked, getSubmitStudentAttendance, getSubmitStudentAttendanceApp } from '@model/attendance.model'



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
