import sql from '@config/db'
import { internalServerError, notFoundError } from '@utils/error/error'
import { Count, DbFunctionResponse } from 'types/db'
import { FormADetail, FormAList, FormAType, masterdate } from 'types/mpc'
import { Attendees, Role, countCourse } from 'types/user'

export async function getMeetingDateForFormA(
    acad_year: string,
    acadSessionLid: number,
    programLid: number,
    subjectLid: number,
    userLid: number,
) {
    const data = await sql<masterdate[]>`
        SELECT DISTINCT mf.id as meeting_id,mf.meeting_name, (mf.meeting_date)::varchar FROM master_form mf
        INNER JOIN form_user fu ON mf.id = fu.form_lid
        INNER JOIN mpc_role mr ON mr.id = fu.mpc_role_lid
        INNER JOIN user_session_info usi ON fu.user_session_lid = usi.id
        LEFT JOIN form_a fa ON fa.form_lid = mf.id
        WHERE mf.acad_year = ${acad_year} AND mf.program_lid = ${programLid} AND 
        mf.subject_lid = ${subjectLid} AND mf.session_lid = ${acadSessionLid} 
        AND usi.user_lid = ${userLid} AND fu.active = TRUE AND usi.active = TRUE
        AND mr.name = 'course_anchor' AND mf.active = true AND mf.final_submit = TRUE AND fa.id IS NULL AND mf.parent_id IS NULL;`

    if (data.length === 0) {
        notFoundError('getMeetingDateForFormA Model', 'Data not found')
    }

    return data
}

export async function getAttendeesByMeetingID(meetingId: number) {
    const data = await sql<Attendees[]>`
            SELECT DISTINCT mf.id as meeting_lid, usi.id as user_session_lid,pu.username,pu.first_name,pu.last_name  FROM master_form mf 
            INNER JOIN form_user fu ON mf.id = fu.form_lid
            INNER JOIN user_session_info usi ON fu.user_session_lid = usi.id
            INNER JOIN public.user pu ON usi.user_lid = pu.id
            WHERE mf.active = true and fu.active = true and pu.active = true
            AND mf.id = ${meetingId};`

    if (data.length === 0) {
        notFoundError('getMeetingDateForFormA Model', 'Data not found')
    }

    return data
}

export async function getFormA(meetingId: number) {
    const data = await sql`SELECT jsonb_build_object(
        'header',
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', campus_lid,
                    'name', CONCAT(campus_name, ' - ', campus_abbr)
                )
            )
            FROM (
                SELECT DISTINCT
                    cm.id AS campus_lid,
                    cm.campus_name,
                    cm.campus_abbr
                FROM master_form mf
                INNER JOIN user_session_info usi ON usi.subject_lid = mf.subject_lid
                INNER JOIN campus cm ON cm.id = usi.campus_lid
                WHERE mf.active = true AND usi.active = true AND cm.active = true AND mf.final_submit = true
                AND mf.id = ${meetingId}
            ) AS distinct_campuses
        ),
        'points',
        (
            SELECT jsonb_agg(
                DISTINCT
                jsonb_build_object(
                    'id', id,
                    'point', point,
                    'subPoint', sub_point,
                    'type', type,
                    'campus_lid', campus_lid,
                    'campus_name', campus_name
                )
            )
            FROM (
                SELECT DISTINCT * FROM point_master pm
                CROSS JOIN (
                    SELECT DISTINCT
                        cm.id AS campus_lid,
                        cm.campus_name,
                        cm.campus_abbr
                    FROM master_form mf
                    INNER JOIN user_session_info usi ON usi.subject_lid = mf.subject_lid
                    INNER JOIN campus cm ON cm.id = usi.campus_lid
                    WHERE mf.active = true AND usi.active = true AND cm.active = true AND mf.final_submit = true
                    AND mf.id = ${meetingId}
                ) AS campus_info
                where pm.active = true
            ) AS point_master_with_campus_info
        )
    );
  `

    if (data.length === 0) {
        notFoundError('getMeetingDateForFormA Model', 'Data not found')
    }

    console.log('getMeetingDateForFormA Model', data)

    return data[0].jsonb_build_object as FormAType
}

export async function insertFromA(submitBody: any, user_lid: number) {
    const data = await sql`SELECT * FROM upsert_form_a(${submitBody}, ${user_lid})`

    if (data.length === 0) {
        internalServerError('Submit Form-A Model', 'Internal Server Error')
    }

    return data[0].upsert_form_a as DbFunctionResponse
}

export async function getFormAList(limit: number, offset: number, search: string, userLid: number, role: Role) {
    let data: FormAList[] = []
    if (role === 'role_admin' || role === 'role_faculty') {
        data = await sql<FormAList[]>`
            SELECT DISTINCT mf.id as meeting_id, mf.meeting_name, 
                CONCAT(INITCAP(pm.program_name) , ' - ' , pm.program_code) as program_name, fa.final_submit,
                CONCAT(sm.subject_name , ' - ' , sm.subject_abbr) as subject_name, mf.acad_year
            FROM master_form mf
                INNER JOIN form_a fa ON fa.form_lid = mf.id
                INNER JOIN program pm ON pm.id = mf.program_lid
                INNER JOIN subject sm ON sm.id = mf.subject_lid
                INNER JOIN user_session_info usi
            ON usi.program_lid = pm.id AND usi.subject_lid = sm.id
                WHERE CONCAT(mf.id, pm.program_name, pm.program_code, sm.subject_name, sm.subject_abbr, mf.acad_year) ILIKE  ${
                    '%' + search + '%'
                }
                AND usi.user_lid = ${userLid} AND mf.active = true AND fa.active = true
            ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``} ;`
    } else {
        data = await sql<FormAList[]>`
            SELECT DISTINCT mf.id as meeting_id, mf.meeting_name, 
                CONCAT(INITCAP(pm.program_name) , ' - ' , pm.program_code) as program_name, TRUE AS final_submit,
                CONCAT(sm.subject_name , ' - ' , sm.subject_abbr) as subject_name, mf.acad_year
            FROM master_form mf
                INNER JOIN form_a fa ON fa.form_lid = mf.id
                INNER JOIN program pm ON pm.id = mf.program_lid
                INNER JOIN subject sm ON sm.id = mf.subject_lid
                INNER JOIN program_campus pc ON pc.program_lid = pm.id
				INNER JOIN campus c ON c.id = pc.campus_lid
				INNER JOIN organization o ON o.id = c.organization_lid
				INNER JOIN user_organization uo ON 
				CASE WHEN o.parent_id IS NOT NULL THEN 
                        uo.organization_lid = o.parent_id
                    ELSE 
                        uo.organization_lid = o.id
                    END
                WHERE CONCAT(mf.id, pm.program_name, pm.program_code, sm.subject_name, sm.subject_abbr, mf.acad_year) ILIKE  ${
                    '%' + search + '%'
                }
                AND uo.user_lid = ${userLid} AND mf.active = true AND fa.active = true 
                AND pm.active = true AND sm.active = true
                AND pc.active = true AND c.active = true AND o.active = true
            ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``} ;`
    }

    if (data.length === 0) {
        notFoundError('getFormAList Model', 'Data not found')
    }

    return data
}

export async function getFormAListCount(userLid: number, role: Role) {
    let data: Count[] 
    
    if (role === 'role_admin' || role === 'role_faculty') {
        data = await sql<Count[]>`
            SELECT COUNT(t.*) FROM
            (
                SELECT DISTINCT mf.id as meeting_id, mf.meeting_name, 
                    CONCAT(INITCAP(pm.program_name) , ' - ' , pm.program_code) as program_name, fa.final_submit,
                    CONCAT(sm.subject_name , ' - ' , sm.subject_abbr) as subject_name, mf.acad_year
                FROM master_form mf
                    INNER JOIN form_a fa ON fa.form_lid = mf.id
                    INNER JOIN program pm ON pm.id = mf.program_lid
                    INNER JOIN subject sm ON sm.id = mf.subject_lid
                    INNER JOIN user_session_info usi
                ON usi.program_lid = pm.id AND usi.subject_lid = sm.id
                    WHERE usi.user_lid = ${userLid} AND mf.active = true AND fa.active = true
            ) t;`
    } else {
        data = await sql<Count[]>`
            SELECT COUNT(t.*) FROM 
            (
                SELECT DISTINCT mf.id as meeting_id, mf.meeting_name, 
                    CONCAT(INITCAP(pm.program_name) , ' - ' , pm.program_code) as program_name, TRUE AS final_submit,
                    CONCAT(sm.subject_name , ' - ' , sm.subject_abbr) as subject_name, mf.acad_year
                FROM master_form mf
                    INNER JOIN form_a fa ON fa.form_lid = mf.id
                    INNER JOIN program pm ON pm.id = mf.program_lid
                    INNER JOIN subject sm ON sm.id = mf.subject_lid
                    INNER JOIN program_campus pc ON pc.program_lid = pm.id
                    INNER JOIN campus c ON c.id = pc.campus_lid
                    INNER JOIN organization o ON o.id = c.organization_lid
                    INNER JOIN user_organization uo ON 
                    CASE WHEN o.parent_id IS NOT NULL THEN 
                            uo.organization_lid = o.parent_id
                        ELSE 
                            uo.organization_lid = o.id
                        END
                WHERE uo.user_lid = ${userLid} AND mf.active = true AND fa.active = true 
                    AND pm.active = true AND sm.active = true
                    AND pc.active = true AND c.active = true AND o.active = true 
            ) t;`
    }

    if (data.length === 0) {
        notFoundError('getFormAList Model', 'Data not found')
    }

    return data[0].count ?? 0
}

export async function getFormAdetail(meetingId: number) {
    const data = await sql`SELECT jsonb_build_object(
        'header',
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', campus_lid,
                    'name', CONCAT(campus_name, ' - ',campus_abbr)
                )
            )
            FROM (
                SELECT DISTINCT
                    cm.id AS campus_lid,
                    cm.campus_name,
                    cm.campus_abbr
                FROM master_form mf
                INNER JOIN user_session_info usi ON usi.subject_lid = mf.subject_lid
                INNER JOIN campus cm ON cm.id = usi.campus_lid
                WHERE mf.active = true AND usi.active = true AND cm.active = true
                AND mf.id = ${meetingId}
            ) AS distinct_campuses
        ),
        'points',
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'point', point,
                    'subPoint', sub_point,
                    'type', type,
                    'text', text,
                    'campus_lid', campus_lid,
                    'campus_name', campus_name
                )
            )
            FROM  (
                SELECT pm.id, pm.point, pm.sub_point, pm.type, fa.text,
                cm.id AS campus_lid, cm.campus_name 
                FROM form_a fa
                INNER JOIN campus cm ON cm.id = fa.campus_lid
                INNER JOIN point_master pm ON pm.id = fa.point_lid
                INNER JOIN master_form mf ON mf.id = fa.form_lid
                WHERE mf.id =  ${meetingId}
                ORDER BY pm.id
            ) AS points_detail
        ),
        'meeting_data',
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'acad_year', acad_year,
                    'program_name', program_name,
                    'subject_name', subject_name,
                    'acad_session', acad_session,
                    'meeting_date', meeting_date,
                    'meeting_id', meeting_id
                    
                )
            )
            FROM (
                    SELECT mf.acad_year, CONCAT(INITCAP(pm.program_name), ' - ', pm.program_code) as program_name, CONCAT(sm.subject_name ,' - ', sm.subject_abbr) as subject_name, sesm.acad_session, mf.meeting_date, mf.id as meeting_id FROM master_form mf
                    INNER JOIN program pm ON pm.id = mf.program_lid
                    INNER JOIN subject sm ON sm.id = mf.subject_lid
                    INNER JOIN session_master sesm ON sesm.id = mf.session_lid
                    WHERE mf.id = ${meetingId}
            ) AS meeting_detail
        )
    );`
    if (data.length === 0) {
        notFoundError('formAdetail Model', 'Data not found')
    }

    console.log('getMeetingDateForFormA Model', data)

    return data[0].jsonb_build_object as FormADetail
}

export async function getMeetingCountAndCourseAncor(meeting_id: number) {
    const data = await sql<countCourse[]>`
                    SELECT COUNT(DISTINCT mf.id), STRING_AGG(DISTINCT to_char(mf.meeting_date, 'DD/MM/YYYY HH:MI AM'), ', ') AS date_array,
                    JSON_AGG(DISTINCT jsonb_build_object(
                            'value', pu.username || ' - ' || pu.first_name || ' ' || pu.last_name || ' - ' || cm.campus_abbr,
                            'label', pu.username || ' - ' || pu.first_name || ' ' || pu.last_name || ' - ' || cm.campus_abbr,
                            'selected', TRUE
                        )) AS ca_array
                    FROM master_form mf
                    INNER JOIN form_user fu
                    ON fu.form_lid = mf.id
                    INNER JOIN mpc_role mr ON fu.mpc_role_lid = mr.id
                    INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                    INNER JOIN public.user pu ON pu.id = usi.user_lid
                    INNER JOIN campus cm ON cm.id = usi.campus_lid
                    INNER JOIN master_form mf2 ON 
                    mf.program_lid = mf2.program_lid AND mf.session_lid = mf2.session_lid AND 
                    mf.subject_lid = mf2.subject_lid AND mf.acad_year = mf2.acad_year
                    WHERE fu.active = TRUE AND mf.active = TRUE
                    AND mr.name = 'course_anchor' 
                    AND usi.active = TRUE AND mr.active = TRUE`

    if (data.length === 0) {
        notFoundError('getMeetingCountAndCourseAncor Model', 'Data not found')
    }

    return data
}

export async function getMeetingCountAndCourseAncorByID(meeting_id: number) {
    const data = await sql<countCourse[]>`
        SELECT COUNT(DISTINCT mf.id), STRING_AGG(DISTINCT to_char(mf.meeting_date, 'DD/MM/YYYY HH:MI AM'), ', ') AS date_array,
        JSON_AGG(DISTINCT jsonb_build_object(
                'value', pu.username || ' - ' || pu.first_name || ' ' || pu.last_name || ' - ' || cm.campus_abbr,
                'label', pu.username || ' - ' || pu.first_name || ' ' || pu.last_name || ' - ' || cm.campus_abbr,
                'selected', TRUE
            )) AS ca_array
        FROM master_form mf
        INNER JOIN form_user fu
        ON fu.form_lid = mf.id
        INNER JOIN mpc_role mr ON fu.mpc_role_lid = mr.id
        INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
        INNER JOIN public.user pu ON pu.id = usi.user_lid
        INNER JOIN campus cm ON cm.id = usi.campus_lid
        WHERE fu.active = TRUE AND mf.active = TRUE
        AND mr.name = 'course_anchor' AND mf.program_lid = (SELECT program_lid FROM master_form WHERE id = ${meeting_id}) AND mf.session_lid = (SELECT session_lid FROM master_form WHERE id = ${meeting_id}) 
        AND mf.subject_lid = (SELECT subject_lid FROM master_form WHERE id = ${meeting_id})
        AND mf.acad_year = (SELECT acad_year FROM master_form WHERE id = ${meeting_id})
        AND usi.active = TRUE AND mr.active = TRUE;`

    if (data.length === 0) {
        notFoundError('getMeetingCountAndCourseAncor Model', 'Data not found')
    }

    return data
}
