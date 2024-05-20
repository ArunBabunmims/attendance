import sql from '@config/db'
import { internalServerError, noData, notFoundError } from '@utils/error/error'
import { Count, DbFunctionResponse } from 'types/db'
import { FormASummaryType, FormBDataDb, FormBList, Options, formBDetails } from 'types/mpc'
import { Role } from 'types/user'

export async function getFormASummary(acadYear: string, program: number, acadSession: number) {
    const data = await sql`SELECT
            jsonb_object_agg(
                meeting_name || ' - ' || to_char(meeting_date, 'YYYY-MM-DD"T"HH24:MI:SS'),
                meetings
            ) AS result
        FROM (
            SELECT
                mf.meeting_date,
                mf.meeting_name,
                jsonb_agg(
                    jsonb_build_object(
                        'text', fa.text,
                        'type', pm.type,
                        'point', pm.point,
                        'point_id', fa.point_lid,
                        'campus_id', fa.campus_lid,
                        'sub_point', pm.sub_point,
                        'campus_name', cm.campus_name
                    )
                ) AS meetings
            FROM form_a fa
            JOIN master_form mf ON mf.id = fa.form_lid
            JOIN point_master pm ON pm.id = fa.point_lid
            JOIN campus cm ON cm.id = fa.campus_lid
            JOIN subject sm ON sm.id = mf.subject_lid
            WHERE
                    mf.acad_year = ${acadYear}
                    AND  mf.program_lid = ${program}
                    AND  mf.session_lid = ${acadSession}
                    AND fa.final_submit = true
                    AND mf.final_submit = true
            GROUP BY mf.meeting_date, mf.meeting_name, sm.subject_name
        ) AS subquery`

    if (data.length === 0) {
        notFoundError('getFormBFromFormA Model', 'Data not found')
    }

    if (!data[0]?.result) {
        notFoundError('getFormBFromFormA Model', 'Data not found')
    }

    console.log('getFormBFromFormA Model', data)
    return data[0].result as FormASummaryType
}

export async function getFormBData(acadYear: string, program: number, acadSession: number) {
    const data = await sql<FormBDataDb[]>`
                        SELECT 
                        fbp.id AS point_id, 
                        fbp.point, 
                        fbp.abbr, 
                        sm.id AS subject_id,
                        CONCAT(sm.subject_name, ' (' , sm.subject_abbr, ') ') as subject_name,
                        STRING_AGG(DISTINCT 
                            CASE 
                                WHEN fbp.abbr = 'course_anchor_names' THEN
                                    COALESCE(
                                        (
                                            SELECT 
                                                STRING_AGG(DISTINCT CONCAT(pu.first_name, ' ', pu.last_name, ' ( ', cm.campus_abbr, ' ) '), ' AND ')
                                            FROM 
                                                form_user fu
                                                INNER JOIN mpc_role mr ON mr.id = fu.mpc_role_lid
                                                INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                                                INNER JOIN campus cm ON cm.id = usi.campus_lid
                                                INNER JOIN public.user pu ON pu.id = usi.user_lid
                                            WHERE 
                                                mr.name = 'course_anchor' AND mf.id = fu.form_lid  
                                                AND cm.active = 'TRUE' AND mr.active = 'TRUE' AND usi.active = 'TRUE' AND pu.active = 'TRUE'
                                            GROUP BY mf.id 
                                        ), 
                                        ''
                                    )
                                WHEN fbp.abbr = 'members_of_meeting' THEN
                                    COALESCE(
                                        (
                                            SELECT 
                                                STRING_AGG(DISTINCT CONCAT(pu.first_name, ' ', pu.last_name, ' ( ', cm.campus_abbr, ' ) '), ' AND ')
                                            FROM 
                                                form_user fu
                                                INNER JOIN mpc_role mr ON mr.id = fu.mpc_role_lid
                                                INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                                                INNER JOIN campus cm ON cm.id = usi.campus_lid
                                                INNER JOIN public.user pu ON pu.id = usi.user_lid
                                            WHERE 
                                                mr.name IN ('attendees', 'absentees') AND mf.id = fu.form_lid 
                                                AND mr.active = TRUE AND usi.active = TRUE AND cm.active = TRUE AND pu.active = TRUE
                                        ), 
                                        ''
                                    )
                                WHEN fbp.abbr = 'meeting_dates' THEN mf.meeting_date::TEXT
                                WHEN fbp.abbr = 'number_of_meetings_count' THEN mf.meeting_date::TEXT
                                WHEN fbp.abbr = 'faculty_absence' THEN
                                    COALESCE(
                                        (
                                            SELECT 
                                                STRING_AGG(DISTINCT CONCAT(pu.first_name, ' ', pu.last_name, ' ( ', cm.campus_abbr, ' ) '), ' AND ')
                                            FROM 
                                                form_user fu
                                                INNER JOIN mpc_role mr ON mr.id = fu.mpc_role_lid
                                                INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                                                INNER JOIN campus cm ON cm.id = usi.campus_lid
                                                INNER JOIN public.user pu ON pu.id = usi.user_lid
                                            WHERE 
                                                mr.name = 'absentees' 
                                                AND mf.subject_lid = sm.id AND mf.id = fu.form_lid 
                                                AND mr.active = TRUE AND usi.active = TRUE AND cm.active = TRUE  AND pu.active = TRUE
                                            GROUP BY mf.id
                                        ), 
                                        'N.A'
                                    )
                                WHEN fbp.abbr = 'ica_status' THEN 
                                    CASE 
                                        WHEN fa.text = '' THEN '0'::TEXT 
                                        ELSE 
                                            CASE 
                                                WHEN fa.text::INT = 100 THEN 'COMPLETED' 
                                                ELSE 'INCOMPLETED'
                                            END
                                    END
                                WHEN fbp.abbr = 'remarks' THEN 
                                    COALESCE(
                                        (
                                            SELECT remark 
                                            FROM form_b fb
                                            WHERE fb.acad_year = mf.acad_year
                                                AND fb.program_lid = mf.program_lid
                                                AND fb.session_lid = mf.session_lid
                                                AND fb.subject_lid = mf.subject_lid
                                                AND fb.active = TRUE
                                        ), 
                                        ''
                                    )
                                ELSE fa.text
                            END, ', ') AS text
                    FROM 
                        form_b_point_master fbp
                        INNER JOIN form_a fa ON fa.point_lid = fbp.point_master_lid
                        INNER JOIN point_master pm ON pm.id = fbp.point_master_lid
                        INNER JOIN master_form mf ON mf.id = fa.form_lid 
                        INNER JOIN subject sm ON sm.id = mf.subject_lid
                        WHERE 
                            mf.acad_year = ${acadYear}
                            AND mf.program_lid = ${program}
                            AND mf.session_lid = ${acadSession}
                    GROUP BY 
                        fbp.id, fbp.point, sm.id, sm.subject_name, sm.subject_abbr, fbp.abbr;
    `
    console.log("DATA RETURNED:::::::::::::", data);
    
    if (data.length === 0) {
        notFoundError('getFormBData Model', 'Data not found')
    }

    console.log('getFormBData Model', data)
    return data
}

export async function insertFormB(submitBody: string, user_lid: number) {
    const data = await sql`SELECT * FROM upsert_form_b(${submitBody}, ${user_lid})`
    if (data.length === 0) {
        internalServerError('Submit Form-B Model', 'Internal Server Error')
    }

    return data[0].upsert_form_b as DbFunctionResponse
}

export async function getFormBList(limit: number, offset: number, search: string, userLid: number, role: Role) {
    let data: FormBList[] = [] 
    
    if (role === "role_admin" || role === "role_faculty") {
        data = await sql<FormBList[]>`
                            SELECT DISTINCT
                            pm.id as program_lid,
                            CONCAT(INITCAP(pm.program_name) , ' - ' , pm.program_code) as program_name,
                             fb.acad_year, 
                            sesm.id as session_lid, sesm.acad_session, fb.final_submit, sm.subject_name, fb.subject_lid 
                            FROM form_b fb
                            INNER JOIN program pm ON pm.id = fb.program_lid
                            INNER JOIN subject sm ON sm.id = fb.subject_lid
                            INNER JOIN session_master sesm ON sesm.id = fb.session_lid
                            INNER JOIN user_session_info usi ON usi.subject_lid = sm.id AND usi.program_lid = pm.id
                            INNER JOIN master_form mf ON mf.session_lid = fb.session_lid
                            INNER JOIN form_a fa ON fa.form_lid = mf.id
                            WHERE CONCAT(mf.id, pm.program_name, pm.program_code, sm.subject_name, sm.subject_abbr, mf.acad_year, sesm.acad_session) ILIKE  ${
                                '%' + search + '%'
                            }
                            AND mf.active = true AND fa.active = true AND usi.user_lid = ${userLid}
                            GROUP BY 
                            pm.program_name, fb.acad_year, pm.program_code, fb.subject_lid, sm.subject_name,
                            sesm.acad_session, fb.final_submit, sesm.id, pm.id
                            ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``};`
        
    } else {
        data = await sql<FormBList[]>`
                            SELECT DISTINCT
                            pm.id as program_lid,
                            CONCAT(INITCAP(pm.program_name) , ' - ' , pm.program_code) as program_name,
                             fb.acad_year, 
                            sesm.id as session_lid, sesm.acad_session, TRUE AS final_submit, sm.subject_name, fb.subject_lid
                            FROM form_b fb
                            INNER JOIN program pm ON pm.id = fb.program_lid
                            INNER JOIN subject sm ON sm.id = fb.subject_lid
                            INNER JOIN session_master sesm ON sesm.id = fb.session_lid
                            INNER JOIN program_campus pc ON pc.program_lid = pm.id
                            INNER JOIN campus c ON c.id = pc.campus_lid
                            INNER JOIN organization o ON o.id = c.organization_lid
                            INNER JOIN user_organization uo ON
                            CASE WHEN o.parent_id IS NOT NULL THEN
                                uo.organization_lid = o.parent_id
                            ELSE 
                                uo.organization_lid = o.id
                            END
                            INNER JOIN master_form mf ON mf.session_lid = fb.session_lid
                            INNER JOIN form_a fa ON fa.form_lid = mf.id
                            WHERE CONCAT(mf.id, pm.program_name, pm.program_code, sm.subject_name, sm.subject_abbr, mf.acad_year, sesm.acad_session) ILIKE  ${
                                '%' + search + '%'
                            }
                            AND mf.active = true AND fa.active = true AND uo.user_lid = ${userLid}
                            GROUP BY 
                            pm.program_name, fb.acad_year, pm.program_code, fb.subject_lid, sm.subject_name,
                            sesm.acad_session, fb.final_submit, sesm.id, pm.id
                            ${limit !== -1 ? sql`OFFSET ${offset} LIMIT ${limit}` : sql``};`
    }

    if (data.length === 0) {
        notFoundError('getFormBList Model', 'No Data Present!')
    }

    return data
}

export async function getFormBListCount(userLid: number, role: Role) {
    let data: Count[] = [] 
    
    if (role === "role_admin" || role === "role_faculty") {
        data = await sql<Count[]>`
                            SELECT COUNT(t.*) FROM 
                            (
                                SELECT DISTINCT
                                    pm.id as program_lid,
                                    CONCAT(INITCAP(pm.program_name) , ' - ' , pm.program_code) as program_name,
                                    fb.acad_year, 
                                    sesm.id as session_lid, sesm.acad_session, fb.final_submit
                                FROM form_b fb
                                    INNER JOIN program pm ON pm.id = fb.program_lid
                                    INNER JOIN subject sm ON sm.id = fb.subject_lid
                                    INNER JOIN session_master sesm ON sesm.id = fb.session_lid
                                    INNER JOIN user_session_info usi ON usi.subject_lid = sm.id AND usi.program_lid = pm.id
                                    INNER JOIN master_form mf ON mf.session_lid = fb.session_lid
                                    INNER JOIN form_a fa ON fa.form_lid = mf.id
                                WHERE mf.active = true AND fa.active = true AND usi.user_lid = ${userLid}
                                    GROUP BY 
                                    pm.program_name, fb.acad_year, pm.program_code, fb.subject_lid,
                                    sesm.acad_session, fb.final_submit, sesm.id, pm.id
                            ) t;`
        
    } else {
        data = await sql<Count[]>`
                            SELECT COUNT(t.*) FROM 
                            (
                                SELECT DISTINCT
                                    pm.id as program_lid,
                                    CONCAT(INITCAP(pm.program_name) , ' - ' , pm.program_code) as program_name,
                                    fb.acad_year, 
                                    sesm.id as session_lid, sesm.acad_session, fb.final_submit
                                FROM form_b fb
                                    INNER JOIN program pm ON pm.id = fb.program_lid
                                    INNER JOIN subject sm ON sm.id = fb.subject_lid
                                    INNER JOIN session_master sesm ON sesm.id = fb.session_lid
                                    INNER JOIN program_campus pc ON pc.program_lid = pm.id
                                    INNER JOIN campus c ON c.id = pc.campus_lid
                                    INNER JOIN organization o ON o.id = c.organization_lid
                                    INNER JOIN user_organization uo ON
                                CASE WHEN o.parent_id IS NOT NULL THEN
                                    uo.organization_lid = o.parent_id
                                ELSE 
                                    uo.organization_lid = o.id
                                END
                                    INNER JOIN master_form mf ON mf.session_lid = fb.session_lid
                                    INNER JOIN form_a fa ON fa.form_lid = mf.id
                                WHERE mf.active = true AND fa.active = true AND uo.user_lid = ${userLid}
                                    GROUP BY 
                                    pm.program_name, fb.acad_year, pm.program_code, fb.subject_lid,
                                    sesm.acad_session, fb.final_submit, sesm.id, pm.id
                            ) t;`
    }

    if (data.length === 0) {
        notFoundError('getFormBListCount Model', 'Data not found')
    }

    return data[0].count ?? 0
}

export async function getFormBDetails(acadYear: string, sessionLid: number, programLid: number) {
    const data = await sql<formBDetails[]>`
                            SELECT DISTINCT
                            INITCAP(pm.program_name) as program_name, pm.id as program_lid,
                            fb.acad_year, sesm.acad_session as acad_session, sesm.id as session_lid FROM form_b fb
                            INNER JOIN program pm ON pm.id = fb.program_lid
                            INNER JOIN session_master sesm ON sesm.id = fb.session_lid
                            INNER JOIN master_form mf ON mf.session_lid = fb.session_lid
                            INNER JOIN form_a fa ON fa.form_lid = mf.id
                            WHERE 
                            mf.active = true AND fa.active = true AND fa.final_submit = true AND mf.final_submit = true
                            AND fb.acad_year = ${acadYear}
                            AND fb.session_lid = ${sessionLid}
                            AND fb.program_lid = ${programLid}
    `

    if (data.length === 0) {
        notFoundError('getFormBListById Model', 'Data not found')
    }

    return data[0]
}

export async function subjectHeader(acadYear: string, programLid: number, sessionLid: number) {
    const data = await sql`
    SELECT COUNT(DISTINCT fa.campus_lid), mf.subject_lid, CONCAT(MAX(ss.subject_name), ' - ', MAX(ss.subject_abbr)) as subject_header
    FROM master_form mf
    INNER JOIN subject ss ON ss.id = mf.subject_lid
    INNER JOIN form_a fa ON fa.form_lid = mf.id
    WHERE mf.acad_year = ${acadYear} AND mf.program_lid = ${programLid} AND mf.session_lid =  ${sessionLid}
    GROUP BY mf.subject_lid;`
    if (data.length === 0) {
        noData('subjectHeader', 'No Data Available');
    }

    return data
}

export async function subjectCampusHeader(acadYear: string, programLid: number, sessionLid: number) {
    const data = await sql`
    SELECT DISTINCT mf.subject_lid, fa.campus_lid, cc.campus_name FROM master_form mf
        INNER JOIN form_a fa ON fa.form_lid = mf.id
        INNER JOIN campus cc ON cc.id = fa.campus_lid
    WHERE mf.acad_year = ${acadYear} AND mf.program_lid = ${programLid} AND mf.session_lid =  ${sessionLid}; `
    if (data.length === 0) {
        noData('subjectHeader', 'No Data Available');
    }

    return data
}

export async function formBHeaderWrite(acadYear: string, programLid: number, sessionLid: number,user_lid: number, subjectLid: number) {
    const data = await sql`
    SELECT 
    subject_id, 
    subject_name, 
    COUNT(campus_lid) AS count, 
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'campus_lid', campus_lid, 'campus_name', 
        campus_name
      )
    ) AS campus_arr, 
    STRING_AGG(DISTINCT remark, ', ') AS remarks 
  FROM 
    (
      SELECT 
        mf.subject_lid AS subject_id, 
        MAX(ss.subject_name) AS subject_name, 
        fa.campus_lid, 
        cc.campus_name, 
        fb.remark 
      FROM 
        master_form mf 
        INNER JOIN subject ss ON ss.id = mf.subject_lid 
        INNER JOIN form_a fa ON fa.form_lid = mf.id 
        INNER JOIN campus cc ON cc.id = fa.campus_lid
        INNER JOIN form_user fu ON fu.form_lid = mf.id
        INNER JOIN mpc_role mr ON mr.id = fu.mpc_role_lid
        INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
        INNER JOIN public.user pu ON pu.id = usi.user_lid
        LEFT JOIN form_b fb ON fb.acad_year = mf.acad_year 
        AND fb.program_lid = mf.program_lid 
        AND fb.session_lid = mf.session_lid 
        AND fb.subject_lid = mf.subject_lid 
      WHERE 
        mf.acad_year = ${acadYear} 
        AND mf.program_lid = ${programLid}
        AND mf.session_lid = ${sessionLid}
        AND pu.id = ${user_lid}
        AND ss.id = ${subjectLid}
        AND mr.abbr = 'pa' 
      GROUP BY 
        mf.subject_lid, 
        fa.campus_lid, 
        cc.campus_name, 
        fb.remark
    ) AS subquery 
  GROUP BY 
    subject_id, 
    subject_name;`
    if (data.length === 0) {
        noData('formBHeaderWrite', 'No Data Available');
    }

    return data
}

// export async function formBvalueWrite(acadYear: string, programLid: number, sessionLid: number,user_lid: number, subjectLid: number) {
//     const data = await sql`
//                             SELECT 
//                             subquery.point,
//                             subquery.sub_point,
//                             jsonb_object_agg(
//                                 (subquery.campus_lid || '-' || subquery.subject_lid), 
//                                 subquery.text
//                             ) 
//                         FROM (
//                             SELECT 
//                                 pm.point, 
//                                 pm.sub_point, 
//                                 fa.campus_lid, 
//                                 mf.subject_lid,
//                                 CASE 
//                                     WHEN pm.point='Course Anchor' THEN STRING_AGG(DISTINCT CONCAT(pu.username, '-', pu.first_name, ' ', pu.last_name), ', ')
//                                     ELSE CASE
//                                             WHEN pm.point='Number of Meetings' THEN (SELECT COUNT(*) FROM master_form mff where mff.subject_lid =  mf.subject_lid)::TEXT
//                                             ELSE CASE WHEN pm.point = 'Date of Meetings' THEN STRING_AGG(DISTINCT mf.meeting_date::TEXT,', ')
//                                             ELSE STRING_AGG(DISTINCT fa.text, ', ')
//                                             END
//                                         END
//                                 END AS text
//                             FROM 
//                                 master_form mf
//                             INNER JOIN 
//                                 form_a fa ON fa.form_lid = mf.id
//                             INNER JOIN 
//                                 point_master pm ON pm.id = fa.point_lid
//                             INNER JOIN 
//                                 form_user fu ON fu.form_lid = mf.id
//                             INNER JOIN 
//                                 mpc_role mr ON mr.id = fu.mpc_role_lid
//                             INNER JOIN
//                                 user_session_info usi ON usi.id = fu.user_session_lid
//                             INNER JOIN
//                                 public.user pu ON pu.id = usi.user_lid
//                             WHERE 
//                                 mr.abbr = 'ca' AND mf.acad_year = ${acadYear} AND mf.program_lid = ${programLid} AND mf.session_lid =  ${sessionLid} AND mf.subject_lid = ${subjectLid}
//                             GROUP BY 
//                                 pm.point, 
//                                 pm.sub_point, 
//                                 fa.campus_lid, 
//                                 mf.subject_lid
//                         ) subquery
//                         GROUP BY 
//                             subquery.point, 
//                             subquery.sub_point
//                         ORDER BY 
//                             subquery.point, 
//                             subquery.sub_point;`

//     if (data.length === 0) {
//         noData('formBvalueWrite', 'No Data Available');
//     }

//     return data
    
// }


export async function formBvalueWrite(acadYear: string, programLid: number, sessionLid: number,user_lid: number, subjectLid: number) {
    const data = await sql`
    SELECT 
    subquery.point, 
    subquery.sub_point, 
    jsonb_object_agg(
      (
        subquery.campus_lid || '-' || subquery.subject_lid
      ), 
      subquery.text
    ) 
  FROM 
    (
      SELECT 
        pm.point, 
        pm.sub_point, 
        fa.campus_lid, 
        mf.subject_lid, 
        STRING_AGG(DISTINCT fa.text, ', ') AS text 
      FROM 
        master_form mf 
        INNER JOIN form_a fa ON fa.form_lid = mf.id 
        RIGHT JOIN point_master pm ON pm.id = fa.point_lid 
        INNER JOIN form_user fu ON fu.form_lid = mf.id 
        INNER JOIN mpc_role mr ON mr.id = fu.mpc_role_lid 
        INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid 
        INNER JOIN public.user pu ON pu.id = usi.user_lid 
      WHERE 
        mr.abbr = 'ca' 
        AND mf.acad_year = ${acadYear} 
        AND mf.program_lid = ${programLid}  
        AND mf.session_lid = ${sessionLid} 
        AND mf.subject_lid = ${subjectLid} 
      GROUP BY 
        pm.point, 
        pm.sub_point, 
        fa.campus_lid, 
        mf.subject_lid 
      UNION 
      SELECT 
        'Course Anchor' AS point, 
        '-' AS sub_point, 
        fa.campus_lid, 
        mf.subject_lid, 
        STRING_AGG(
          DISTINCT CONCAT(
            pu.username, '-', pu.first_name, ' ', 
            pu.last_name
          ), 
          ', '
        ) AS text 
      FROM 
        master_form mf 
        INNER JOIN form_user fu ON fu.form_lid = mf.id 
        INNER JOIN mpc_role mr ON mr.id = fu.mpc_role_lid 
        INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid 
        INNER JOIN public.user pu ON pu.id = usi.user_lid 
        INNER JOIN form_a fa ON fa.form_lid = mf.id 
      WHERE 
        mr.abbr = 'ca'
        AND mf.acad_year = ${acadYear}  
        AND mf.program_lid = ${programLid} 
        AND mf.session_lid = ${sessionLid}  
        AND mf.subject_lid = ${subjectLid}  
      GROUP BY 
        fa.campus_lid, 
        mf.subject_lid 
      UNION 
      SELECT 
        'Number of Meetings' AS point, 
        '-' AS sub_point, 
        fa.campus_lid, 
        mf.subject_lid, 
        COUNT(DISTINCT mf.id):: TEXT AS text 
      FROM 
        master_form mf 
        INNER JOIN form_a fa ON fa.form_lid = mf.id 
      WHERE 
        mf.acad_year = ${acadYear}  
        AND mf.program_lid = ${programLid}  
        AND mf.session_lid = ${sessionLid}  
        AND mf.subject_lid = ${subjectLid}  
      GROUP BY 
        fa.campus_lid, 
        mf.subject_lid 
      UNION 
      SELECT 
        'Date of Meetings' AS point, 
        '-' AS sub_point, 
        fa.campus_lid, 
        mf.subject_lid, 
        STRING_AGG(
          DISTINCT meeting_date :: TEXT, ', '
        ) AS text 
      FROM 
        master_form mf 
        INNER JOIN form_a fa ON fa.form_lid = mf.id 
      WHERE 
        mf.acad_year = ${acadYear}  
        AND mf.program_lid = ${programLid}  
        AND mf.session_lid = ${sessionLid}  
        AND mf.subject_lid = ${subjectLid}  
      GROUP BY 
        fa.campus_lid, 
        mf.subject_lid
    ) subquery 
  GROUP BY 
    subquery.point, 
    subquery.sub_point 
  ORDER BY 
    subquery.point, 
    subquery.sub_point;`

    if (data.length === 0) {
        noData('formBvalueWrite', 'No Data Available');
    }

    return data
    
}

export async function formBHeaderRead(acadYear: string, programLid: number, sessionLid: number) {
    const data = await sql`
                        SELECT
                        subject_id,
                        subject_name,
                        COUNT(campus_lid) AS count,
                        JSON_AGG(
                            JSON_BUILD_OBJECT(
                                'campus_lid', campus_lid,
                                'campus_name', campus_name
                            )
                        ) AS campus_arr,
                        STRING_AGG(DISTINCT remark, ', ') AS remarks 
                    FROM (
                        SELECT 
                            mf.subject_lid AS subject_id,
                            MAX(ss.subject_name) AS subject_name,
                            fa.campus_lid,
                            cc.campus_name,
                            fb.remark
                        FROM
                            master_form mf
                            INNER JOIN subject ss ON ss.id = mf.subject_lid
                            INNER JOIN form_a fa ON fa.form_lid = mf.id
                            INNER JOIN campus cc ON cc.id = fa.campus_lid
                            LEFT JOIN form_b fb ON fb.acad_year = mf.acad_year AND fb.program_lid = mf.program_lid AND fb.session_lid = mf.session_lid AND fb.subject_lid = mf.subject_lid
                            WHERE mf.acad_year = ${acadYear} AND mf.program_lid = ${programLid} AND mf.session_lid =  ${sessionLid}
                        GROUP BY
                            mf.subject_lid,
                            fa.campus_lid,
                            cc.campus_name,
                            fb.remark
                    ) AS subquery
                    GROUP BY
                        subject_id,
                        subject_name;`
    if (data.length === 0) {
        noData('formBHeaderRead', 'No Data Available');
    }

    return data
}

export async function formBvalueRead(acadYear: string, programLid: number, sessionLid: number) {
    const data = await sql`
                            SELECT 
                            subquery.point,
                            subquery.sub_point,
                            jsonb_object_agg(
                                (subquery.campus_lid || '-' || subquery.subject_lid), 
                                subquery.text
                            ) 
                        FROM (
                            SELECT 
                                pm.point, 
                                pm.sub_point, 
                                fa.campus_lid, 
                                mf.subject_lid,
                                CASE 
                                    WHEN pm.point='Course Anchor' THEN STRING_AGG(DISTINCT CONCAT(pu.username, '-', pu.first_name, ' ', pu.last_name), ', ')
                                    ELSE CASE
                                            WHEN pm.point='Number of Meetings' THEN (SELECT COUNT(*) FROM master_form mff where mff.subject_lid =  mf.subject_lid)::TEXT
                                            ELSE CASE WHEN pm.point = 'Date of Meetings' THEN STRING_AGG(DISTINCT mf.meeting_date::TEXT,', ')
                                            ELSE STRING_AGG(DISTINCT fa.text, ', ')
                                            END
                                        END
                                END AS text
                            FROM 
                                master_form mf
                            INNER JOIN 
                                form_a fa ON fa.form_lid = mf.id
                            INNER JOIN 
                                point_master pm ON pm.id = fa.point_lid
                            INNER JOIN 
                                form_user fu ON fu.form_lid = mf.id
                            INNER JOIN 
                                mpc_role mr ON mr.id = fu.mpc_role_lid
                            INNER JOIN
                                user_session_info usi ON usi.id = fu.user_session_lid
                            INNER JOIN
                                public.user pu ON pu.id = usi.user_lid
                            WHERE 
                                mr.abbr = 'ca' AND mf.acad_year = ${acadYear} AND mf.program_lid = ${programLid} AND mf.session_lid =  ${sessionLid}
                            GROUP BY 
                                pm.point, 
                                pm.sub_point, 
                                fa.campus_lid, 
                                mf.subject_lid
                        ) subquery
                        GROUP BY 
                            subquery.point, 
                            subquery.sub_point
                        ORDER BY 
                            subquery.point, 
                            subquery.sub_point;`

    if (data.length === 0) {
        noData('formBvalueRead', 'No Data Available');
    }

    return data
    
}

export async function formBHeaderAnalytics(acadYear: string, programLid: number) {
    const data = await sql`
                        SELECT
                        subject_id,
                        subject_name,
                        COUNT(campus_lid) AS count,
                        JSON_AGG(
                            JSON_BUILD_OBJECT(
                                'campus_lid', campus_lid,
                                'campus_name', campus_name
                            )
                        ) AS campus_arr,
                        STRING_AGG(DISTINCT remark, ', ') AS remarks 
                    FROM (
                        SELECT 
                            mf.subject_lid AS subject_id,
                            MAX(ss.subject_name) AS subject_name,
                            fa.campus_lid,
                            cc.campus_name,
                            fb.remark
                        FROM
                            master_form mf
                            INNER JOIN subject ss ON ss.id = mf.subject_lid
                            INNER JOIN form_a fa ON fa.form_lid = mf.id
                            INNER JOIN campus cc ON cc.id = fa.campus_lid
                            LEFT JOIN form_b fb ON fb.acad_year = mf.acad_year AND fb.program_lid = mf.program_lid AND fb.session_lid = mf.session_lid AND fb.subject_lid = mf.subject_lid
                            WHERE mf.acad_year = ${acadYear} AND mf.program_lid = ${programLid}
                        GROUP BY
                            mf.subject_lid,
                            fa.campus_lid,
                            cc.campus_name,
                            fb.remark
                    ) AS subquery
                    GROUP BY
                        subject_id,
                        subject_name;`
    if (data.length === 0) {
        noData('formBHeaderAnalytics', 'No Data Available');
    }

    return data
}

export async function formBvalueAnalytics(acadYear: string, programLid: number) {
    const data = await sql`
                            SELECT 
                            subquery.point,
                            subquery.sub_point,
                            jsonb_object_agg(
                                (subquery.campus_lid || '-' || subquery.subject_lid), 
                                subquery.text
                            ) 
                        FROM (
                            SELECT 
                                pm.point, 
                                pm.sub_point, 
                                fa.campus_lid, 
                                mf.subject_lid,
                                CASE 
                                    WHEN pm.point='Course Anchor' THEN STRING_AGG(DISTINCT CONCAT(pu.username, '-', pu.first_name, ' ', pu.last_name), ', ')
                                    ELSE CASE
                                            WHEN pm.point='Number of Meetings' THEN (SELECT COUNT(*) FROM master_form mff where mff.subject_lid =  mf.subject_lid)::TEXT
                                            ELSE CASE WHEN pm.point = 'Date of Meetings' THEN STRING_AGG(DISTINCT mf.meeting_date::TEXT,', ')
                                            ELSE STRING_AGG(DISTINCT fa.text, ', ')
                                            END
                                        END
                                END AS text
                            FROM 
                                master_form mf
                            INNER JOIN 
                                form_a fa ON fa.form_lid = mf.id
                            INNER JOIN 
                                point_master pm ON pm.id = fa.point_lid
                            INNER JOIN 
                                form_user fu ON fu.form_lid = mf.id
                            INNER JOIN 
                                mpc_role mr ON mr.id = fu.mpc_role_lid
                            INNER JOIN
                                user_session_info usi ON usi.id = fu.user_session_lid
                            INNER JOIN
                                public.user pu ON pu.id = usi.user_lid
                            WHERE 
                                mr.abbr = 'ca' AND mf.acad_year = ${acadYear} AND mf.program_lid = ${programLid} 
                            GROUP BY 
                                pm.point, 
                                pm.sub_point, 
                                fa.campus_lid, 
                                mf.subject_lid
                        ) subquery
                        GROUP BY 
                            subquery.point, 
                            subquery.sub_point
                        ORDER BY 
                            subquery.point, 
                            subquery.sub_point;`

    if (data.length === 0) {
        noData('formBvalueRead', 'No Data Available');
    }

    return data
    
}

export async function meetingCountByProgramModel(acadYear: string, programLid: number) {
    const data = await sql<Count[]>`SELECT COUNT(*) FROM master_form WHERE program_lid = ${programLid} AND acad_year = ${acadYear} AND active=true AND parent_id IS NULL;`;

    if (data.length === 0) {
        notFoundError('meetingCountByProgram Model', 'No Count Found')
    }
    return data
}

export async function subjectByProgramSessionModel(acadYear: string, programLid: number , acadSession: number) {
    const data = await sql<Options[]>`SELECT DISTINCT CONCAT(ss.subject_name, ' - ', ss.acad_year ) AS label, ss.id AS value, false AS selected FROM master_form mf 
                    INNER JOIN subject ss ON mf.subject_lid = ss.id
                    where mf.program_lid = ${programLid} AND mf.acad_year = ${acadYear} 
                    AND mf.session_lid = ${acadSession}; `;

    if (data.length === 0) {
        notFoundError('subjectByProgramSessionModel Model', 'No Data Found')
    }
    return data
}
