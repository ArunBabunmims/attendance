import sql from '@config/db'
import { notFoundError } from '@utils/error/error'
import { masterFormInsertSchema } from '@validations/index.validations'
import * as z from 'zod'
import { Count, DbFunctionResponse } from 'types/db'
import {
    AnchorsForMasterFormEdit,
    MasterFormWithUsers,
    MasterMeetingBySubject,
    MasterMeetingList,
    MeetingMaster,
    MPCRoleJson,
    MPCRoleJsonAgg,
    Options,
    SchoolListAnalytics,
    UserRoleResult,
} from 'types/mpc'
import { AssignFacultyRoleBody } from 'types/request'
import { Anchor, Role } from 'types/user'
import { Program, Subject } from 'types/details'
import { CombinedResult, UserAttendanceList } from 'types/attendance'

export async function getProgramByAcadYearAndUsername(acadYear: string, userLid: number, userRole: Role, campusLid: number){
    let data: Program[] = []
    if (userRole === 'role_admin') {
        data = await sql<Program[]>`
                SELECT DISTINCT
                    pm.id, pm.program_id,
                    CASE WHEN pm.program_abbr = ' ' THEN pm.program_name ELSE pm.program_abbr END as program_name,
                    pm.program_code
                FROM
                    admin_program ap
                    INNER JOIN program pm ON pm.id = ap.program_lid
                    INNER JOIN program_campus pc ON pm.id = pc.program_lid
                WHERE
                    ap.user_lid = ${userLid}
                    AND pm.active = TRUE AND ap.active = TRUE
                    ${campusLid !== -1 && !isNaN(campusLid) ? sql`AND pc.campus_lid = ${campusLid}` : sql``};`
    } else if (userRole === 'role_faculty') {
        data = await sql<Program[]>`
                    SELECT DISTINCT
                        pm.id, pm.program_id,
                        CASE WHEN pm.program_abbr = ' ' THEN pm.program_name ELSE pm.program_abbr END as program_name,
                        pm.program_code
                    FROM
                        user_session_info usi
                        INNER JOIN program pm ON pm.id = usi.program_lid
                    WHERE
                        usi.acad_year = ${acadYear} AND usi.user_lid = ${userLid}
                        AND usi.active = TRUE AND pm.active = TRUE
                        ${campusLid !== -1 && !isNaN(campusLid) ? sql`AND usi.campus_lid = ${campusLid}` : sql``};`
    }

    if (data.length === 0) {
        notFoundError('Program Model', 'Program not found')
    }

    return data
}

export async function getSubjectsByProgram(programLid: number, acadYear: number, acadSessionLid: number) {
    const data = await sql<Subject[]>`
            SELECT
                DISTINCT sm.id, sm.subject_id,
                sm.subject_name, sm.subject_abbr, sm.acad_year
            FROM
                subject sm
            WHERE
                sm.program_lid = ${programLid} AND sm.active = TRUE AND sm.acad_year = ${acadYear}
            ORDER BY sm.subject_name;`

    if (data.length === 0) {
        notFoundError('Subject Model', 'Subjects not found')
    }
    return data
}

export async function getSubjectsByProgramAnalytics(programLid: number, acadYear: number) {
    const data = await sql<Subject[]>`
                    SELECT DISTINCT sm.id, sm.subject_id, sm.subject_name, sm.subject_abbr, sm.acad_year
                    FROM master_form mf INNER JOIN subject sm ON sm.id = mf.subject_lid
                    WHERE sm.active = true 
                    AND mf.program_lid = ${programLid} AND mf.acad_year = ${acadYear};`

    if (data.length === 0) {
        notFoundError('Subject Model', 'Subjects not found')
    }
    return data
}

type AcadSession = {
    id: number
    acad_session: string
}

export async function getAcadSessionByProgram(programLid: number, acadYear: number) {
    const data = await sql<AcadSession[]>`
            SELECT
            DISTINCT asm.id, asm.acad_session
        FROM
            subject sm
            INNER JOIN session_master asm ON asm.id = sm.session_lid
        WHERE
             sm.program_lid = ${programLid} AND sm.acad_year = ${acadYear};`

    if (data.length === 0) {
        notFoundError('Acad Session Model By Program', 'Acad Session not found')
    }
    return data
}

export async function getAcadSessionBySubject(subjectLid: number) {
    const data = await sql<AcadSession[]>`
            SELECT
            DISTINCT asm.id, asm.acad_session
        FROM
            user_session_info usi
            INNER JOIN session_master asm ON asm.id = usi.session_lid
        WHERE
            usi.subject_lid = ${subjectLid};`

    if (data.length === 0) {
        notFoundError('Acad Session Model By Subject', 'Acad Session not found')
    }

    return data
}

// export async function getUserListForAssigningRole(
//     userLid: number,
//     limit: number,
//     offset: number,
//     search: string,
//     role: Role,
// ) {
//     const data = await sql<UserRoleResult[]>`SELECT 
//                 usi.id as user_session_lid, pu.username, pu.first_name, pu.last_name,smt.acad_session,
//                 pm.program_id, INITCAP(pm.program_name) as program_name, pm.program_code,
//                 sm.subject_name, sm.subject_abbr,
//                 om.organization_id, om.organization_name, om.organization_abbr,
//                 cm.campus_id, cm.campus_name, cm.campus_abbr,
//                 COALESCE(bool_or(mr.name = 'program_anchor'), FALSE) AS is_program_anchor,
//                 COALESCE(bool_or(mr.name = 'course_anchor'), FALSE) AS is_course_anchor
//             FROM 
//                 user_session_info usi
//                 LEFT JOIN mpc_user_role mur ON usi.id = mur.user_session_lid AND mur.active = TRUE
//                 LEFT JOIN public.user pu ON pu.id = usi.user_lid AND pu.active = TRUE
//                 LEFT JOIN mpc_role mr ON mr.id = mur.mpc_role_lid AND mr.active = TRUE
//                 LEFT JOIN program pm ON pm.id = usi.program_lid AND pm.active = TRUE
//                 LEFT JOIN subject sm ON sm.id = usi.subject_lid AND sm.active = TRUE
//                 LEFT JOIN campus cm ON cm.id = usi.campus_lid AND cm.active = TRUE
//                 LEFT JOIN session_master smt on smt.id = usi.session_lid
//                 LEFT JOIN organization om ON om.id = cm.organization_lid AND om.active = TRUE
//             WHERE usi.active = TRUE
//                 AND usi.program_lid IN (SELECT program_lid FROM ${
//                     role === 'role_admin' ? sql`admin_program` : sql`user_session_info`
//                 } WHERE user_lid = ${userLid})
//                 AND 
//                 CONCAT(usi.id, pu.username, pu.first_name, ' ', pu.last_name,
//                     pm.program_id, pm.program_name, pm.program_code,
//                     sm.subject_name, sm.subject_abbr,
//                     om.organization_id, om.organization_name, om.organization_abbr,
//                     cm.campus_id, cm.campus_name, cm.campus_abbr) ILIKE ${'%' + search + '%'}
//                 AND usi.acad_year IN (EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT)
//             GROUP BY 
//                 usi.id, pu.username, pu.first_name, pu.last_name,
//                 pm.program_id, pm.program_name, pm.program_code,
//                 sm.subject_name, sm.subject_abbr,
//                 om.organization_id, om.organization_name, om.organization_abbr,
//                 cm.campus_id, cm.campus_name, cm.campus_abbr, smt.acad_session
//                 ORDER BY pu.first_name ASC
//             ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``}`
//     if (data.length === 0) {
//         notFoundError('User Model', 'User not found')
//     }

//     return data
// }

export async function getUserListForAssigningRole(
    userLid: number,
    limit: number,
    offset: number,
    search: string,
    role: Role,
) {
    const data = await sql<UserRoleResult[]>`
    SELECT
	usi.id as user_session_lid, pu.username, pu.first_name, pu.last_name,smt.acad_session,
	pm.program_id, INITCAP(pm.program_name) as program_name, pm.program_code,
	sm.subject_name, sm.subject_abbr,
	om.organization_id, om.organization_name, om.organization_abbr,
	cm.campus_id, cm.campus_name, cm.campus_abbr,
	COALESCE(bool_or(mr.name = 'program_anchor'), FALSE) AS is_program_anchor,
	COALESCE(bool_or(mr.name = 'course_anchor'), FALSE) AS is_course_anchor
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
WHERE usi.active = TRUE AND uo.user_lid = ${userLid} AND 
 CONCAT(usi.id, pu.username, pu.first_name, ' ', pu.last_name,
	 pm.program_id, pm.program_name, pm.program_code,
	 sm.subject_name, sm.subject_abbr,
	 om.organization_id, om.organization_name, om.organization_abbr,
	 cm.campus_id, cm.campus_name, cm.campus_abbr) ILIKE ${'%' + search + '%'}
	AND usi.acad_year IN (EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT)
GROUP BY 
	usi.id, pu.username, pu.first_name, pu.last_name,
	pm.program_id, pm.program_name, pm.program_code,
	sm.subject_name, sm.subject_abbr,
	om.organization_id, om.organization_name, om.organization_abbr,
	cm.campus_id, cm.campus_name, cm.campus_abbr, smt.acad_session, mur.modified_date 
	ORDER BY mur.modified_date ASC
     ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``}`
    if (data.length === 0) {
        notFoundError('User Model', 'User not found')
    }

    return data
}

// export async function getUserListCountForAssigningRole(userLid: number, role: Role) {
//     const data = await sql<Count[]>`SELECT COUNT(s.*) as count FROM (
//                     SELECT 
//                         usi.id as user_session_lid, pu.username, pu.first_name, pu.last_name,
//                         pm.program_id, INITCAP(pm.program_name) as program_name, pm.program_code,
//                         om.organization_id, om.organization_name, om.organization_abbr,
//                         cm.campus_id, cm.campus_name, cm.campus_abbr,
//                         COALESCE(bool_or(mr.name = 'program_anchor'), FALSE) AS is_program_anchor,
//                         COALESCE(bool_or(mr.name = 'course_anchor'), FALSE) AS is_course_anchor
//                     FROM 
//                         user_session_info usi
//                         LEFT JOIN mpc_user_role mur ON usi.id = mur.user_session_lid AND mur.active = TRUE
//                         LEFT JOIN public.user pu ON pu.id = usi.user_lid AND pu.active = TRUE
//                         LEFT JOIN mpc_role mr ON mr.id = mur.mpc_role_lid AND mr.active = TRUE
//                         LEFT JOIN program pm ON pm.id = usi.program_lid AND pm.active = TRUE
//                         LEFT JOIN campus cm ON cm.id = usi.campus_lid AND cm.active = TRUE
//                         LEFT JOIN organization om ON om.id = cm.organization_lid AND om.active = TRUE
//                     WHERE usi.active = TRUE
//                         AND usi.program_lid IN (SELECT program_lid FROM ${
//                             role === 'role_admin' ? sql`admin_program` : sql`user_session_info`
//                         } WHERE user_lid = ${userLid})
//                     GROUP BY 
//                         usi.id, pu.username, pu.first_name, pu.last_name,
//                         pm.program_id, pm.program_name, pm.program_code,
//                         om.organization_id, om.organization_name, om.organization_abbr,
//                         cm.campus_id, cm.campus_name, cm.campus_abbr
//                 ) AS s;`
//     return data?.[0].count ?? 0
// }

export async function getUserListCountForAssigningRole(userLid: number, role: Role) {
    const data = await sql<Count[]>`SELECT COUNT(*) AS count
                    FROM (
                        SELECT 
                            COUNT(user_session_lid)
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
                        WHERE 
                            usi.active = TRUE AND uo.user_lid = ${userLid}
                            AND usi.acad_year IN (EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT)
                        GROUP BY 
                            usi.id, pu.username, pu.first_name, pu.last_name,
                            pm.program_id, pm.program_name, pm.program_code,
                            sm.subject_name, sm.subject_abbr,
                            om.organization_id, om.organization_name, om.organization_abbr,
                            cm.campus_id, cm.campus_name, cm.campus_abbr, smt.acad_session, mur.modified_date 
                        ORDER BY 
                            mur.modified_date ASC
                    ) AS subquery;`
    return data?.[0].count ?? 0
}

export async function assignFacultyRole(data: AssignFacultyRoleBody[], userLid: number, role: Role) {
    const json = await sql`SELECT assign_mpc_role(${data as any}, ${userLid}, ${role});`

    return json[0].assign_mpc_role as DbFunctionResponse
}

export async function getProgramAnchor(
    acad_year: string,
    acadSessionLid: number,
    programLid: number,
    subjectLid: number,
) {
    const data = await sql<Anchor[]>`
        SELECT
        DISTINCT ON (pu.username) usi.id as user_session_lid, pu.username, pu.first_name, pu.last_name, 
            cm.campus_id, cm.campus_name, cm.campus_abbr
        FROM
            user_session_info usi
            INNER JOIN mpc_user_role mur ON mur.user_session_lid = usi.id
            INNER JOIN mpc_role mr ON mr.id = mur.mpc_role_lid
            INNER JOIN campus cm ON cm.id = usi.campus_lid
            INNER JOIN public.user pu ON pu.id = usi.user_lid
        WHERE
            mr.name = 'program_anchor'
            AND usi.acad_year = ${acad_year}
            AND usi.program_lid = ${programLid}
            AND usi.subject_lid = ${subjectLid} AND usi.active = TRUE
            AND mur.active = TRUE AND mr.active = TRUE;`

    if (data.length === 0) {
        notFoundError('Program Anchor Model', 'Program Anchor not found')
    }

    return data
}

export async function getCourseAnchor(
    acad_year: string,
    acadSessionLid: number,
    programLid: number,
    subjectLid: number,
) {
    const data = await sql<Anchor[]>`
                SELECT
                DISTINCT ON (pu.username) usi.id as user_session_lid, pu.username, pu.first_name, pu.last_name, 
                    cm.campus_id, cm.campus_name, cm.campus_abbr
                FROM
                    user_session_info usi
                    INNER JOIN mpc_user_role mur ON mur.user_session_lid = usi.id
                    INNER JOIN mpc_role mr ON mr.id = mur.mpc_role_lid
                    INNER JOIN campus cm ON cm.id = usi.campus_lid
                    INNER JOIN public.user pu ON pu.id = usi.user_lid
                WHERE
                    mr.name = 'course_anchor'
                    AND usi.acad_year = ${acad_year}
                    AND usi.program_lid = ${programLid} AND usi.subject_lid = ${subjectLid}
                    AND usi.active = TRUE AND mur.active = TRUE AND mr.active = TRUE;`

    if (data.length === 0) {
        notFoundError('Course Anchor Model', 'Course Anchor not found')
    }

    return data
}

export async function getAttendees(acad_year: string, acadSessionLid: number, programLid: number, subjectLid: number) {
    const data = await sql<Anchor[]>`
                SELECT
                DISTINCT ON (pu.username) usi.id as user_session_lid, pu.username, pu.first_name, pu.last_name, 
                    cm.campus_id, cm.campus_name, cm.campus_abbr
                FROM
                    user_session_info usi
                    INNER JOIN campus cm ON cm.id = usi.campus_lid
                    INNER JOIN public.user pu ON pu.id = usi.user_lid
                WHERE
                    usi.acad_year = ${acad_year}
                    AND usi.program_lid = ${programLid} AND usi.subject_lid = ${subjectLid}
                    AND usi.active = TRUE;`

    if (data.length === 0) {
        notFoundError('Course Anchor Model', 'Course Anchor not found')
    }

    return data
}

export async function getMasterFormList(userLid: number, limit: number, offset: number, search: string, role: Role) {
    let data: MasterMeetingBySubject[] = []

    if (role === 'role_admin' || role === 'role_faculty') {
        data = await sql<MasterMeetingBySubject[]>`
            SELECT
                DISTINCT mf.program_lid, mf.subject_lid,
                mf.acad_year,  sm.subject_id, sm.subject_name,
                sm.subject_abbr, INITCAP(pm.program_name) as program_name,
                pm.program_id, pm.program_code
            FROM
                master_form mf
                INNER JOIN program pm ON pm.id = mf.program_lid
                INNER JOIN subject sm ON sm.id = mf.subject_lid
                INNER JOIN session_master ssm ON ssm.id = mf.session_lid
                INNER JOIN form_user fu ON fu.form_lid = mf.id
                INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                INNER JOIN public.user pu ON pu.id = usi.user_lid
                WHERE pu.id = ${userLid} AND mf.parent_id IS NULL
                AND mf.active = TRUE AND pm.active = TRUE
                AND sm.active = TRUE AND ssm.active = TRUE AND pu.active = TRUE
                AND CONCAT(mf.program_lid, mf.subject_lid,
                    mf.acad_year,  sm.subject_id, sm.subject_name,
                    sm.subject_abbr, pm.program_name,
                    pm.program_id, pm.program_code) ILIKE ${'%' + search + '%'}
            GROUP BY
                mf.program_lid, mf.subject_lid,
                mf.acad_year,  sm.subject_id, sm.subject_name,
                sm.subject_abbr, pm.program_name,
                pm.program_id, pm.program_code
            ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``} ;`
    } else {
        data = await sql<MasterMeetingBySubject[]>`
            SELECT 
                DISTINCT 
                    mf.program_lid, mf.subject_lid, mf.acad_year, 
                    sm.subject_id, sm.subject_name, sm.subject_abbr, 
                    INITCAP(pm.program_name) as program_name, pm.program_id, pm.program_code 
            FROM 
                master_form mf 
                INNER JOIN program pm ON pm.id = mf.program_lid 
                INNER JOIN subject sm ON sm.id = mf.subject_lid 
                INNER JOIN session_master ssm ON ssm.id = mf.session_lid 
                INNER JOIN program_campus pc ON pc.program_lid = pm.id 
                INNER JOIN campus c ON c.id = pc.campus_lid 
                INNER JOIN organization o ON o.id = c.organization_lid 
                INNER JOIN user_organization uo ON CASE WHEN o.parent_id IS NOT NULL THEN uo.organization_lid = o.parent_id ELSE uo.organization_lid = o.id END 
            WHERE 
                uo.user_lid = ${userLid} AND mf.active = TRUE AND pm.active = TRUE 
                AND sm.active = TRUE AND ssm.active = TRUE AND uo.active = TRUE 
                AND CONCAT(mf.program_lid, mf.subject_lid,
                    mf.acad_year,  sm.subject_id, sm.subject_name,
                    sm.subject_abbr, pm.program_name,
                    pm.program_id, pm.program_code) ILIKE ${'%' + search + '%'}
            GROUP BY 
                mf.program_lid, mf.subject_lid, 
                mf.acad_year, sm.subject_id, sm.subject_name, 
                sm.subject_abbr, pm.program_name, pm.program_id, pm.program_code
            ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``} ;`
    }

    if (data.length === 0) {
        notFoundError('Master Form Model', 'Master Form not found')
    }

    return data
}

export async function getMasterFormListCount(userLid: number, role: Role) {
    let data: Count[] = []; 
    
    if (role === 'role_admin' || role === 'role_faculty') {
        data = await sql<Count[]>`
            SELECT COUNT(t.*) FROM
            (
                SELECT
                DISTINCT mf.program_lid, mf.subject_lid,
                    mf.acad_year,  sm.subject_id, sm.subject_name,
                    sm.subject_abbr, INITCAP(pm.program_name) as program_name,
                    pm.program_id, pm.program_code
                FROM
                    master_form mf
                    INNER JOIN program pm ON pm.id = mf.program_lid
                    INNER JOIN subject sm ON sm.id = mf.subject_lid
                    INNER JOIN session_master ssm ON ssm.id = mf.session_lid
                    INNER JOIN form_user fu ON fu.form_lid = mf.id
                    INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                    INNER JOIN public.user pu ON pu.id = usi.user_lid
                    WHERE pu.id = ${userLid}
                    AND mf.active = TRUE AND pm.active = TRUE
                    AND sm.active = TRUE AND ssm.active = TRUE AND pu.active = TRUE
                GROUP BY
                    mf.program_lid, mf.subject_lid,
                    mf.acad_year,  sm.subject_id, sm.subject_name,
                    sm.subject_abbr, pm.program_name,
                    pm.program_id, pm.program_code
            ) t;`
    } else {
        data = await sql<Count[]>`
            SELECT COUNT(t.*) FROM
            (
                SELECT 
                    DISTINCT 
                        mf.program_lid, mf.subject_lid, mf.acad_year, 
                        sm.subject_id, sm.subject_name, sm.subject_abbr, 
                        INITCAP(pm.program_name) as program_name, pm.program_id, pm.program_code 
                FROM 
                    master_form mf 
                    INNER JOIN program pm ON pm.id = mf.program_lid 
                    INNER JOIN subject sm ON sm.id = mf.subject_lid 
                    INNER JOIN session_master ssm ON ssm.id = mf.session_lid 
                    INNER JOIN program_campus pc ON pc.program_lid = pm.id 
                    INNER JOIN campus c ON c.id = pc.campus_lid 
                    INNER JOIN organization o ON o.id = c.organization_lid 
                    INNER JOIN user_organization uo ON CASE WHEN o.parent_id IS NOT NULL THEN uo.organization_lid = o.parent_id ELSE uo.organization_lid = o.id END 
                WHERE 
                    uo.user_lid = ${userLid} AND mf.active = TRUE AND pm.active = TRUE 
                    AND sm.active = TRUE AND ssm.active = TRUE AND uo.active = TRUE 
                GROUP BY 
                    mf.program_lid, mf.subject_lid, 
                    mf.acad_year, sm.subject_id, sm.subject_name, 
                    sm.subject_abbr, pm.program_name, pm.program_id, pm.program_code
            ) t;`
    }

    return data?.[0].count ?? 0
}

export async function getMasterFormListByYearProgramSubject(
    userLid: number,
    acadYear: number,
    programLid: number,
    subjectLid: number,
    limit: number,
    offset: number,
    search: string,
    role: Role,
) {
    let data: MasterMeetingList[] = []

    if (role === 'role_admin' || role === 'role_faculty') {
        data = await sql<MasterMeetingList[]>`
            SELECT DISTINCT
                mf.id as meeting_id, mf.meeting_name,TO_CHAR(mf.meeting_date, 'DD/MM/YYYY HH:MI AM') as meeting_date,
                mf.final_submit, mf.program_lid, mf.subject_lid,
                mf.acad_year, sm.subject_id, sm.subject_name,
                sm.subject_abbr, INITCAP(pm.program_name) as program_name,
                pm.program_id, pm.program_code,
                ssm.acad_session
            FROM
                master_form mf
                INNER JOIN program pm ON pm.id = mf.program_lid
                INNER JOIN subject sm ON sm.id = mf.subject_lid
                INNER JOIN session_master ssm ON ssm.id = mf.session_lid
                INNER JOIN form_user fu ON fu.form_lid = mf.id
                INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                INNER JOIN public.user pu ON pu.id = usi.user_lid
                WHERE pu.id = ${userLid} AND mf.acad_year = ${acadYear}
                AND mf.program_lid = ${programLid} AND mf.subject_lid = ${subjectLid}
                AND pm.active = TRUE AND sm.active = TRUE
                AND ssm.active = TRUE AND pu.active = TRUE AND mf.active = TRUE
                AND 
                CONCAT(mf.id, mf.meeting_name, mf.meeting_date,
                    mf.program_lid, mf.subject_lid,
                    mf.acad_year, sm.subject_id, sm.subject_name,
                    sm.subject_abbr, pm.program_name,
                    pm.program_id, pm.program_code,
                    ssm.acad_session) ilike ${'%' + search + '%'}
                ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``} ;`
    } else {
        data = await sql<MasterMeetingList[]>`
            SELECT DISTINCT
                mf.id as meeting_id, mf.meeting_name,TO_CHAR(mf.meeting_date, 'DD/MM/YYYY HH:MI AM') as meeting_date,
                TRUE as final_submit, mf.program_lid, mf.subject_lid,
                mf.acad_year, sm.subject_id, sm.subject_name,
                sm.subject_abbr, INITCAP(pm.program_name) as program_name,
                pm.program_id, pm.program_code,
                ssm.acad_session
            FROM
                master_form mf
                INNER JOIN program pm ON pm.id = mf.program_lid
                INNER JOIN subject sm ON sm.id = mf.subject_lid
                INNER JOIN session_master ssm ON ssm.id = mf.session_lid
                INNER JOIN program_campus pc ON pc.program_lid = pm.id
				INNER JOIN campus c ON c.id = pc.campus_lid
				INNER JOIN organization o ON o.id = c.organization_lid
				INNER JOIN user_organization uo ON 
				CASE WHEN o.parent_id IS NOT NULL THEN 
                        uo.organization_lid = o.parent_id
                    ELSE 
                        uo.organization_lid = o.id
                    END
                WHERE uo.user_lid = ${userLid} AND mf.acad_year = ${acadYear}
                AND mf.program_lid = ${programLid} AND mf.subject_lid = ${subjectLid}
                AND pm.active = TRUE AND sm.active = TRUE
                AND ssm.active = TRUE AND uo.active = TRUE AND mf.active = TRUE
                AND 
                CONCAT(mf.id, mf.meeting_name, mf.meeting_date,
                    mf.program_lid, mf.subject_lid,
                    mf.acad_year, sm.subject_id, sm.subject_name,
                    sm.subject_abbr, pm.program_name,
                    pm.program_id, pm.program_code,
                    ssm.acad_session) ilike ${'%' + search + '%'}
                ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``} ;`
    }

    if (data.length === 0) {
        notFoundError('Master Form Model', 'Master Form for this subject not found')
    }

    return data
}

export async function getMasterFormListByYearProgramSubjectCount(
    userLid: number,
    acadYear: number,
    programLid: number,
    subjectLid: number,
    role: Role,
) {
    let data: Count[] = []
    
    if (role === 'role_admin' || role === 'role_faculty') {
        data = await sql<Count[]>`
            SELECT COUNT(t.*) FROM 
            (
                SELECT DISTINCT
                    mf.id as meeting_id, mf.meeting_name,TO_CHAR(mf.meeting_date, 'DD/MM/YYYY HH:MI AM') as meeting_date,
                    mf.final_submit, mf.program_lid, mf.subject_lid,
                    mf.acad_year, sm.subject_id, sm.subject_name,
                    sm.subject_abbr, INITCAP(pm.program_name) as program_name,
                    pm.program_id, pm.program_code,
                    ssm.acad_session
                FROM
                    master_form mf
                    INNER JOIN program pm ON pm.id = mf.program_lid
                    INNER JOIN subject sm ON sm.id = mf.subject_lid
                    INNER JOIN session_master ssm ON ssm.id = mf.session_lid
                    INNER JOIN form_user fu ON fu.form_lid = mf.id
                    INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                    INNER JOIN public.user pu ON pu.id = usi.user_lid
                WHERE pu.id = ${userLid} AND mf.acad_year = ${acadYear}
                AND mf.program_lid = ${programLid} AND mf.subject_lid = ${subjectLid}
                AND pm.active = TRUE AND sm.active = TRUE
                AND ssm.active = TRUE AND pu.active = TRUE AND mf.active = TRUE
            ) t;`
    } else {
        data = await sql<Count[]>`
            SELECT COUNT(t.*) FROM
            (
                SELECT DISTINCT
                    mf.id as meeting_id, mf.meeting_name,TO_CHAR(mf.meeting_date, 'DD/MM/YYYY HH:MI AM') as meeting_date,
                    mf.final_submit, mf.program_lid, mf.subject_lid,
                    mf.acad_year, sm.subject_id, sm.subject_name,
                    sm.subject_abbr, INITCAP(pm.program_name) as program_name,
                    pm.program_id, pm.program_code,
                    ssm.acad_session
                FROM
                    master_form mf
                    INNER JOIN program pm ON pm.id = mf.program_lid
                    INNER JOIN subject sm ON sm.id = mf.subject_lid
                    INNER JOIN session_master ssm ON ssm.id = mf.session_lid
                    INNER JOIN program_campus pc ON pc.program_lid = pm.id
                    INNER JOIN campus c ON c.id = pc.campus_lid
                    INNER JOIN organization o ON o.id = c.organization_lid
                    INNER JOIN user_organization uo ON 
                    CASE WHEN o.parent_id IS NOT NULL THEN 
                            uo.organization_lid = o.parent_id
                        ELSE 
                            uo.organization_lid = o.id
                        END
                    WHERE uo.user_lid = ${userLid} AND mf.acad_year = ${acadYear}
                AND mf.program_lid = ${programLid} AND mf.subject_lid = ${subjectLid}
                AND pm.active = TRUE AND sm.active = TRUE
                AND ssm.active = TRUE AND uo.active = TRUE AND mf.active = TRUE
            ) t;`
    }

    return data?.[0].count ?? 0
}

export async function getMasterFormById(masterFormId: number) {
    const data = await sql<MeetingMaster[]>`SELECT
                    mf.id as meeting_id, mf.meeting_name, mf.meeting_description, 
                    TO_CHAR(mf.meeting_date, 'DD/MM/YYYY HH:MI AM') as meeting_date,
                    TO_CHAR(meeting_date, 'YYYY-MM-DD"T"HH24:MI') as meeting_date_timestamp,  mf.acad_year,
                    mf.program_lid, mf.subject_lid, mf.session_lid,
                    pm.program_id, INITCAP(pm.program_name) as program_name, pm.program_code,
                    sm.subject_id, sm.subject_name, sm.subject_abbr,
                    ssm.acad_session
                FROM
                    master_form mf
                INNER JOIN program pm
                    ON pm.id = mf.program_lid
                INNER JOIN subject sm 
                    ON sm.id = mf.subject_lid
                INNER JOIN session_master ssm
                    ON ssm.id = mf.session_lid
                WHERE mf.active = TRUE AND pm.active = TRUE
                    AND sm.active = TRUE AND ssm.active = TRUE
                AND mf.id = ${masterFormId};`

    if (data.length === 0) {
        notFoundError('Master Form Model', 'Master Form not found')
    }

    return data
}

export async function getMeetingUsersByRole(meetingLid: number) {
    const data = await sql<MPCRoleJsonAgg[]>`
                    SELECT
                    JSONB_OBJECT_AGG(role.name, role.role_json) AS aggregated_json
                FROM
                    (
                    SELECT
                        DISTINCT mr.name,
                        jsonb_agg(DISTINCT jsonb_build_object(
                            'user_session_lid', fu.user_session_lid,
                            'username', pu.username,
                            'first_name', pu.first_name,
                            'last_name', pu.last_name,
                            'campus_id', cm.campus_id,
                            'campus_name', cm.campus_name,
                            'campus_abbr', cm.campus_abbr
                        )) AS role_json
                    FROM
                        form_user fu
                        INNER JOIN mpc_role mr ON fu.mpc_role_lid = mr.id
                        INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                        INNER JOIN public.user pu ON pu.id = usi.user_lid
                        INNER JOIN campus cm ON cm.id = usi.campus_lid
                        INNER JOIN master_form mf ON mf.id = fu.form_lid
                    WHERE
                        fu.active = TRUE
                        AND mr.active = TRUE
                        AND pu.active = TRUE
                        AND usi.active = TRUE
                        AND cm.active = TRUE
                        AND mf.active = TRUE
                        AND mf.id = ${meetingLid}
                    GROUP BY
                        mr.name
                    ) AS role;
`

    if (data.length === 0) {
        notFoundError('Meeting User Model', 'No Users Found for this Meeting!')
    }

    return data[0].aggregated_json as MPCRoleJson
}

export async function InsertMasterForm(data: z.infer<typeof masterFormInsertSchema>, userLid: number) {
    console.log('InsertMasterForm::::::::', data.body)

    const json = await sql`SELECT insert_master_form_array(${data.body as any}, ${userLid});`

    return json[0].insert_master_form_array as DbFunctionResponse
}

export async function deleteMasterForm(masterFormId: number, userlid: number) {
    const json = await sql`SELECT delete_master_form(${masterFormId}, ${userlid});`

    return json[0].delete_master_form as DbFunctionResponse
}

export async function updateMasterForm(body: any, userlid: number) {
    const json = await sql`SELECT update_master_form(${body}, ${userlid});`

    return json[0].update_master_form as DbFunctionResponse
}

export async function getAnchorsForMasterFormEdit(masterFormLid: number) {
    const data = await sql`SELECT
                            jsonb_object_agg(role, roles) as result
                        FROM (
                            SELECT
                                role,
                                json_agg(
                                    jsonb_build_object(
                                        'value', id,
                                        'label', CONCAT(first_name, ' ', last_name, '(', username, ')', ' - ', campus_abbr),
                                        'selected', COALESCE(selected, false)
                                    )
                                ) as roles
                            FROM (
                                SELECT
                                    usi.id, pu.first_name, pu.last_name, pu.username, cm.campus_abbr, mr.name AS role,
                                    COALESCE(fu.active, false) as selected
                                FROM
                                    user_session_info usi
                                    INNER JOIN mpc_user_role mur ON mur.user_session_lid = usi.id
                                    INNER JOIN mpc_role mr ON mr.id = mur.mpc_role_lid
                                    INNER JOIN campus cm ON cm.id = usi.campus_lid
                                    INNER JOIN public.user pu ON pu.id = usi.user_lid
                                    INNER JOIN master_form mf ON mf.acad_year = usi.acad_year
                                        AND mf.program_lid = usi.program_lid
                                        AND mf.subject_lid = usi.subject_lid
                                    LEFT JOIN form_user fu ON fu.user_session_lid = usi.id
                                    AND fu.mpc_role_lid = mr.id AND mf.active = TRUE
                                WHERE
                                    mf.id = ${masterFormLid} AND mf.active = TRUE
                                    AND usi.active = TRUE AND mur.active = TRUE AND mr.active = TRUE
                                    AND cm.active = TRUE AND pu.active = TRUE
                            ) AS subquery
                            GROUP BY role
                        ) AS outer_subquery;`

    if (data.length === 0) {
        return {
            program_anchor: [],
            course_anchor: [],
        }
    }

    return data[0].result as AnchorsForMasterFormEdit[]
}

export async function getAttendeesForMasterFormEdit(masterFormLid: number) {
    const data = await sql<Options[]>`SELECT
                                    usi.id as value,
                                    CONCAT(first_name, ' ', last_name, '(', username, ')', ' - ', campus_abbr) as label,
                                    COALESCE(BOOL_OR(mr.active), false) as selected
                                FROM
                                    user_session_info usi
                                    INNER JOIN campus cm ON cm.id = usi.campus_lid
                                    INNER JOIN public.user pu ON pu.id = usi.user_lid
                                    INNER JOIN master_form mf ON  mf.acad_year = usi.acad_year
                                        AND mf.program_lid = usi.program_lid
                                        AND mf.subject_lid = usi.subject_lid
                                    LEFT JOIN form_user fu ON fu.user_session_lid = usi.id AND fu.active = TRUE
                                    LEFT JOIN mpc_role mr ON mr.id = fu.mpc_role_lid AND mr.name = 'attendees'
                                WHERE
                                    usi.active = TRUE AND mf.id = ${masterFormLid}
                                    AND pu.active = TRUE AND mf.active = TRUE
                                GROUP BY
                                    usi.id, first_name, last_name, username, campus_abbr;`

    return data.length === 0 ? [] : data
}

export async function getMeetingsbySubject(subjectLid: number, acadYear: string, programLid: number) {
    const data = await sql<Options[]>`SELECT DISTINCT CONCAT(TO_CHAR(mf.meeting_date, 'DD/MM/YY HH:MI AM'), ' - ', mf.meeting_name) AS label,mf.id AS value, false AS selected
                            FROM master_form mf INNER JOIN subject sm ON sm.id = mf.subject_lid
                            INNER JOIN form_a fa ON fa.form_lid = mf.id
                            WHERE sm.active = true AND mf.active = true
                            AND mf.subject_lid = ${subjectLid} AND mf.acad_year = ${acadYear} AND mf.program_lid = ${programLid};`

    return data.length === 0 ? [] : data
}

export async function getmeetingsForAnalytics(subjectLid: number, acadYear: string, programLid: number) {
    const data = await sql<Options[]>`SELECT 
                            DISTINCT 
                                CONCAT(TO_CHAR(mf.meeting_date, 'DD/MM/YY HH:MI AM'), ' - ', mf.meeting_name) AS label,
                                mf.id AS value, false AS selected
                            FROM master_form mf
                            INNER JOIN form_a fa ON fa.form_lid = mf.id
                            INNER JOIN form_b fb ON fb.acad_year = mf.acad_year 
                            AND fb.program_lid = mf.program_lid AND fb.subject_lid = mf.subject_lid
                            AND fb.session_lid = mf.session_lid
                            WHERE mf.final_submit = TRUE AND fa.final_submit = TRUE AND fb.final_submit = TRUE
                            AND mf.active = TRUE AND fa.active = TRUE AND fb.active = TRUE
                            AND mf.subject_lid = ${subjectLid} AND mf.acad_year = ${acadYear} AND mf.program_lid = ${programLid};`

    return data.length === 0 ? [] : data
}

export async function getMetingsAndUsersForNotification() {
    const data = await sql`SELECT
                                jsonb_agg(master_form_with_users) AS email_notifications
                            FROM
                                (
                                    SELECT
                                        jsonb_build_object(
                                            'master_form', master_form_data,
                                            'users', users_data.users_info
                                        ) AS master_form_with_users
                                    FROM
                                        (
                                            SELECT
                                                mf.id AS meeting_id, mf.meeting_name, mf.meeting_description,
                                                TO_CHAR(mf.meeting_date, 'DD/MM/YYYY HH:MI AM') AS meeting_date, mf.acad_year,
                                                sm.subject_name, sm.subject_abbr, INITCAP(pm.program_name) as program_name, pm.program_code,
                                                ssm.acad_session
                                            FROM
                                                master_form mf
                                                INNER JOIN program pm ON pm.id = mf.program_lid
                                                INNER JOIN subject sm ON sm.id = mf.subject_lid
                                                INNER JOIN session_master ssm ON ssm.id = mf.session_lid
                                            WHERE
                                                mf.active = TRUE AND pm.active = TRUE AND sm.active = TRUE
                                                AND ssm.active = TRUE AND mf.final_submit = TRUE
                                                AND mf.meeting_date > NOW() AND mf.meeting_date <= NOW() + INTERVAL '24 hours'
                                        ) AS master_form_data
                                    JOIN
                                        (
                                            SELECT
                                                fu.form_lid AS meeting_id,
                                                jsonb_agg(
                                                    jsonb_build_object(
                                                        'name', pu.first_name || ' ' || pu.last_name,
                                                        'email', pu.email
                                                    )
                                                ) AS users_info
                                            FROM
                                                form_user fu
                                                INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                                                INNER JOIN "user" pu ON pu.id = usi.user_lid
                                            WHERE
                                                pu.email IS NOT NULL AND pu.email <> ''
                                                AND usi.active = TRUE AND fu.active = TRUE
                                                AND pu.active = TRUE
                                            GROUP BY
                                                fu.form_lid
                                        ) AS users_data ON master_form_data.meeting_id = users_data.meeting_id
                                ) AS combined_data;`

    return data[0].email_notifications ? (data[0].email_notifications as MasterFormWithUsers[]) : []
}

export async function getEmailBySessionLid(sessionLid : number[]) {
    const sessionIds = sessionLid.map(Number);
    const data = await sql`
        SELECT DISTINCT email 
        FROM user_session_info usi 
        INNER JOIN public.user pu ON pu.id = usi.user_lid
        WHERE usi.id = ANY(${sessionIds})
    `;


    if (data.length === 0) {
        notFoundError('getEmailBySessionLid Model', 'Email not found')
    }
    return data
}

export async function getCampusByUser(user_lid : number) {
    const data = await sql`
                    SELECT DISTINCT CONCAT(cc.campus_name, ' - ', cc.campus_abbr ) AS label, cc.id AS value, false AS selected FROM user_session_info usi
                    INNER JOIN program_campus pc ON pc.program_lid = usi.program_lid
                    INNER JOIN campus cc ON cc.id = pc.campus_lid
                    WHERE user_lid = ${user_lid};`;


    if (data.length === 0) {
        notFoundError('getCampusByUser Model', 'Email not found')
    }
    return data
}

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
