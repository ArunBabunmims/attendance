import sql from '@config/db'
import { internalServerError, notFoundError } from '@utils/error/error'
import { CombinedResult, UserAttendanceList } from 'types/attendance'
import { Count, DbFunctionResponse } from 'types/db'
import { FormADetail, FormAList, FormAType, UserRoleResult, masterdate } from 'types/mpc'
import { Attendees, Role, countCourse } from 'types/user'



export async function getUserListForAssigningRoleForExcel(
    userLid: number
) {
    const data = await sql<UserRoleResult[]>`
        SELECT 
        usi.id as user_session_lid, pu.username, pu.first_name, pu.last_name,
        COALESCE(bool_or(mr.name = 'program_anchor'), FALSE) AS is_program_anchor,
        COALESCE(bool_or(mr.name = 'course_anchor'), FALSE) AS is_course_anchor,
        smt.acad_session,
        INITCAP(pm.program_name) as program_name, pm.program_code,
        sm.subject_name,om.organization_name,cm.campus_name
    FROM 
        user_session_info usi
        LEFT JOIN mpc_user_role mur ON usi.id = mur.user_session_lid AND mur.active = TRUE
        LEFT JOIN public.user pu ON pu.id = usi.user_lid AND pu.active = TRUE
        LEFT JOIN mpc_role mr ON mr.id = mur.mpc_role_lid AND mr.active = TRUE
        LEFT JOIN program pm ON pm.id = usi.program_lid AND pm.active = TRUE
        LEFT JOIN subject sm ON sm.id = usi.subject_lid AND sm.active = TRUE
        LEFT JOIN campus cm ON cm.id = usi.campus_lid AND cm.active = TRUE
        LEFT JOIN session_master smt on smt.id = usi.session_lid
        LEFT JOIN organization om ON om.id = cm.organization_lid AND om.active = TRUE
        INNER JOIN user_organization uo ON CASE WHEN om.parent_id IS NOT NULL THEN uo.organization_lid = om.parent_id ELSE uo.organization_lid = om.id END
    WHERE usi.active = TRUE AND uo.user_lid = ${userLid}
        AND usi.acad_year IN (EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT)
    GROUP BY 
        usi.id, pu.username, pu.first_name, pu.last_name,
        pm.program_id, pm.program_name, pm.program_code,
        sm.subject_name, sm.subject_abbr,
        om.organization_id, om.organization_name, om.organization_abbr,
        cm.campus_id, cm.campus_name, cm.campus_abbr, smt.acad_session
        ORDER BY pu.first_name ASC`;
        
    if (data.length === 0) {
        notFoundError('User Model', 'User not found')
    }

    return data
}
export async function getFacultyAttendanceList(
    userLid: number,
    limit: number,
    offset: number,
    search: string,
    role: Role,
) {
    const data = await sql<UserAttendanceList[]>`
    SELECT e.event_name,
           TO_CHAR(das.start_time, 'YYYY-MM-DD HH24:MI') as start_time,
           TO_CHAR(das.end_time, 'YYYY-MM-DD HH24:MI') as end_time,
           e.event_id,
           das.id
    FROM event e
    INNER JOIN daily_attendence_slot das ON e.id = das.event_lid
    WHERE das.faculty_lid = ${userLid} 
        AND das.active = 'true'
        AND e.active = 'true'
        ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``}`

    if (data.length === 0) {
        notFoundError('User Model', 'User not found')
    }

    return data
}

export async function getCountFacultyAttendanceList(userLid: number, role: Role) {
    const data = await sql<Count[]>`SELECT COUNT(s.*) as count FROM (
                 select * from daily_attendence_slot where faculty_lid=${userLid}
                ) AS s;`
    return data?.[0].count ?? 0
}

export async function getAttendanceStudentList(
    userLid: number,
    id: number,
) {
    const data = await sql<UserAttendanceList[]>`
    SELECT DISTINCT pu.username,pu.first_name,pu.last_name,sd.student_roll_no ,sa.status FROM daily_attendence_slot das
        INNER JOIN user_event ue ON ue.event_lid = das.event_lid
        INNER JOIN public.user pu ON pu.id = ue.user_lid
        INNER JOIN student_details sd ON sd.user_lid = pu.id
        LEFT JOIN student_attendance sa ON sa.slot_lid = das.id AND sa.user_lid = ue.user_lid
    WHERE das.id = ${id}  AND das.faculty_lid = ${userLid};`

    return data || []
}
export async function getAttendanceStudentListMarked(
    userLid: number,
    id: number,
) {
    const data = await sql<UserAttendanceList[]>`
    SELECT distinct  pu.username, pu.first_name, pu.last_name, sd.student_roll_no, sa.status FROM student_attendance sa
    INNER JOIN daily_attendence_slot das ON das.id = sa.slot_lid
    INNER JOIN public.user pu ON pu.id = sa.user_lid
    INNER JOIN student_details sd ON sd.user_lid = pu.id
    INNER JOIN user_role ur on ur.user_lid = pu.id
    INNER JOIN role r on r.id = ur.role_lid
    WHERE r.role = 'role_student' AND das.id = ${id} AND das.faculty_lid= ${userLid};`

    return data || []
}

export async function getCountAttendanceStudentList(userLid: number, role: Role, id: number) {
    const data = await sql<Count[]>`
            SELECT COUNT(*) as count 
            FROM (
                SELECT distinct pu.username, pu.first_name, pu.last_name, sd.student_roll_no
                FROM user_event ue
                INNER JOIN public.user pu ON ue.user_lid = pu.id
                INNER JOIN daily_attendence_slot das ON das.event_lid = ue.event_lid
                INNER JOIN user_role ur ON ur.user_lid = ue.user_lid
                INNER JOIN student_details sd ON ue.user_lid = sd.user_lid
                WHERE ur.role_lid = '1' AND das.id = ${id}
            ) AS s;`
    return data?.[0].count ?? 0
}

export async function getSubmitStudentAttendance(data:any , userLid: number) {
    console.log('Arun::::::::', data)
    console.log('userLid:::::',userLid);
    

    const json = await sql`SELECT upsert_student_attendance(${data}, ${userLid});`

    console.log('pppppppppppppppppppp',json[0].upsert_student_attendance);
    

    return json[0].json[0].upsert_student_attendance_app as DbFunctionResponse
}


export async function getSubmitStudentAttendanceApp(data:any , userLid: number) {
    console.log('Manish::::::::', data)

    const json = await sql`SELECT upsert_student_attendance_app(${data}, ${userLid});`

    console.log('pppppppppppppppppppp',json[0].upsert_student_attendance_app);
    
    return json[0].upsert_student_attendance_app as DbFunctionResponse
}


export async function getFacultyAttendanceListMarked(
    userLid: number,
    limit: number,
    offset: number,
    search: string,
    role: Role,
) {
    const data = await sql<UserAttendanceList[]>`
    SELECT distinct e.event_name,
           TO_CHAR(das.start_time, 'YYYY-MM-DD HH24:MI') as start_time,
           TO_CHAR(das.end_time, 'YYYY-MM-DD HH24:MI') as end_time,
           e.event_id,
           das.id
    FROM event e
    INNER JOIN daily_attendence_slot das ON e.id = das.event_lid
    INNER JOIN student_attendance sa on sa.slot_lid = das.id
    WHERE das.faculty_lid = ${userLid} 
        AND das.active = 'true'
        AND e.active = 'true'
        ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``}`

    if (data.length === 0) {
        notFoundError('User Model', 'User not found')
    }

    return data
}


export async function getCountFacultyAttendanceListMarked(userLid: number, role: Role) {
    const data = await sql<Count[]>`SELECT COUNT(s.*) as count FROM (
                 select * from daily_attendence_slot where faculty_lid=${userLid}
                ) AS s;`
    return data?.[0].count ?? 0
}


export async function getFacultyAttendanceListApp(
    userLid: number,
) {
    const data = await sql`
        SELECT jsonb_agg(
            jsonb_build_object(
                'lecture', jsonb_build_object(
                    'id', das.id,
                    'end_time', TO_CHAR(das.end_time, 'YYYY-MM-DD HH24:MI'),
                    'event_name', e.event_name,
                    'start_time', TO_CHAR(das.start_time, 'YYYY-MM-DD HH24:MI'),
                    'student_count', (
                        SELECT COUNT(*)
                        FROM daily_attendence_slot das_count
                        INNER JOIN user_event ue ON ue.event_lid = das.event_lid
                        INNER JOIN public.user pu ON pu.id = ue.user_lid
                        INNER JOIN student_details sd ON sd.user_lid = pu.id
                        LEFT JOIN student_attendance sa ON sa.slot_lid = das.id AND sa.user_lid = ue.user_lid
                        WHERE das_count.faculty_lid = ${userLid} AND das_count.id = das.id
                    )
                ),
                'student_list', (
                    CASE 
                        WHEN (
                            SELECT COUNT(*)
                            FROM daily_attendence_slot das_count
                            INNER JOIN user_event ue ON ue.event_lid = das.event_lid
                            INNER JOIN public.user pu ON pu.id = ue.user_lid
                            INNER JOIN student_details sd ON sd.user_lid = pu.id
                            LEFT JOIN student_attendance sa ON sa.slot_lid = das.id AND sa.user_lid = ue.user_lid
                            WHERE das_count.faculty_lid = ${userLid} AND das_count.id = das.id
                        ) > 0 THEN
                            (SELECT jsonb_agg(
                                jsonb_build_object(
                                    'status', COALESCE(sa.status, false),
                                    'username', pu.username,
                                    'last_name', pu.last_name,
                                    'first_name', pu.first_name,
                                    'student_roll_no', sd.student_roll_no
                                )
                            )
                            FROM daily_attendence_slot das
                            INNER JOIN user_event ue ON ue.event_lid = das.event_lid
                            INNER JOIN public.user pu ON pu.id = ue.user_lid
                            INNER JOIN student_details sd ON sd.user_lid = pu.id
                            LEFT JOIN student_attendance sa ON sa.slot_lid = das.id AND sa.user_lid = ue.user_lid
                            WHERE das.faculty_lid = ${userLid})
                        ELSE '[]'
                    END
                )
            )
        ) AS combined_result
        FROM event e
        INNER JOIN daily_attendence_slot das ON e.id = das.event_lid
        WHERE das.faculty_lid = ${userLid} AND das.active = 'true' AND e.active = 'true';`

    return data.length > 0 ? data[0].combined_result : [] as CombinedResult[]
}



export async function getFacultyAttendanceListAppNew(userLid: number) {
    const data = await sql`
        SELECT jsonb_agg(lecture_details) AS combined_result
        FROM (
            SELECT jsonb_build_object(
                'lecture', jsonb_build_object(
                    'id', das.id,
                    'end_time', TO_CHAR(das.end_time, 'YYYY-MM-DD HH24:MI'),
                    'event_name', e.event_name,
                    'start_time', TO_CHAR(das.start_time, 'YYYY-MM-DD HH24:MI'),
                    'student_count', COUNT(DISTINCT pu.id)
                ),
                'student_list', jsonb_agg(
                    jsonb_build_object(
                        'status', COALESCE(sa.status, false),
                        'username', pu.username,
                        'last_name', pu.last_name,
                        'first_name', pu.first_name,
                        'student_roll_no', sd.student_roll_no,
                        'user_lid' , sd.user_lid
                    )
                )
            ) AS lecture_details
            FROM daily_attendence_slot das
            INNER JOIN user_event ue ON ue.event_lid = das.event_lid
            INNER JOIN public.user pu ON pu.id = ue.user_lid
            INNER JOIN student_details sd ON sd.user_lid = pu.id
            LEFT JOIN student_attendance sa ON sa.slot_lid = das.id AND sa.user_lid = ue.user_lid
            INNER JOIN event e ON e.id = das.event_lid
            WHERE das.faculty_lid = ${userLid}
            GROUP BY das.id, e.event_name, das.start_time, das.end_time
        ) AS lectures_array`;

    console.log("Dataaaaa", data);

    return data.length > 0 ? data[0].combined_result : [] as CombinedResult[];
}
