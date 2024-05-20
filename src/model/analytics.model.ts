import sql from '@config/db'
import { noData, notFoundError } from '@utils/error/error'
import { Program } from 'types/details'
import { FormBDataDb, SchoolListAnalytics, absenteesChart, formBDetails, icaChart } from 'types/mpc'
import { Role } from 'types/user'

export async function getMpcSchoolList(userLid: number, role: Role) {
    let data: SchoolListAnalytics[] = []
    if (role === 'role_faculty') {
        data = await sql<SchoolListAnalytics[]>`SELECT
                o.organization_id,
                o.organization_abbr,
                o.organization_name,
                t.meeting_count
            FROM
                (
                    SELECT
                        om.id,
                        om.organization_id,
                        om.organization_abbr,
                        om.organization_name,
                        COUNT(DISTINCT mf.id) AS meeting_count,
                        om.parent_id
                    FROM
                        organization om
                    INNER JOIN
                        campus cm ON om.id = cm.organization_lid
                    INNER JOIN
                        user_session_info usi ON usi.campus_lid = cm.id
                    INNER JOIN
                        program pm ON pm.id = usi.program_lid
                    LEFT JOIN
                        organization om2 ON om2.id = om.parent_id
                    INNER JOIN
                        master_form mf ON mf.program_lid = pm.id
                    INNER JOIN 
                        form_a fa ON fa.form_lid = mf.id
                    INNER JOIN 
                        form_b fb ON fb.program_lid = pm.id AND fb.acad_year = mf.acad_year AND fb.session_lid = mf.session_lid 
                        AND fb.subject_lid = mf.subject_lid
                    WHERE usi.user_lid = ${userLid}
                    AND usi.active = TRUE AND cm.active = TRUE AND om.active = TRUE AND pm.active = TRUE AND mf.active = TRUE
                    AND mf.final_submit = TRUE AND fa.final_submit = TRUE AND fb.active = TRUE
                    GROUP BY
                        om.id, om.organization_id, om.organization_abbr, om.organization_name, om.parent_id
                ) t
            INNER JOIN
                organization o ON (
                    (t.parent_id IS NOT NULL AND o.id = t.parent_id)
                    OR
                    (t.parent_id IS NULL AND o.id = t.id)
                )
            GROUP BY o.organization_id, o.organization_abbr, o.organization_name, t.meeting_count;`
    } else if (role === 'role_admin') {
        data = await sql<SchoolListAnalytics[]>`SELECT
                o.organization_id,
                o.organization_abbr,
                o.organization_name,
                t.meeting_count
            FROM
                (
                    SELECT
                        om.id,
                        om.organization_id,
                        om.organization_abbr,
                        om.organization_name,
                        COUNT(DISTINCT mf.id) AS meeting_count,
                        om.parent_id
                    FROM
                        organization om
                    INNER JOIN
                        campus cm ON om.id = cm.organization_lid
                    INNER JOIN
                        program_campus pc ON pc.campus_lid = cm.id
                    INNER JOIN 
                        admin_program ap ON ap.program_lid = pc.program_lid
                    INNER JOIN
                        program pm ON pm.id = ap.program_lid
                    LEFT JOIN
                        organization om2 ON om2.id = om.parent_id
                    INNER JOIN
                        master_form mf ON mf.program_lid = pm.id
                    INNER JOIN 
                        form_a fa ON fa.form_lid = mf.id
                    INNER JOIN 
                        form_b fb ON fb.program_lid = pm.id AND fb.acad_year = mf.acad_year AND fb.session_lid = mf.session_lid 
                        AND fb.subject_lid = mf.subject_lid
                    WHERE ap.user_lid = ${userLid}
                    AND pc.active = TRUE AND ap.active = TRUE AND cm.active = TRUE AND om.active = TRUE 
                    AND pm.active = TRUE AND mf.active = TRUE
                    AND mf.final_submit = TRUE AND fa.final_submit = TRUE AND fb.active = TRUE
                    GROUP BY
                        om.id, om.organization_id, om.organization_abbr, om.organization_name, om.parent_id
                ) t
            INNER JOIN
                organization o ON (
                    (t.parent_id IS NOT NULL AND o.id = t.parent_id)
                    OR
                    (t.parent_id IS NULL AND o.id = t.id)
                )
            GROUP BY o.organization_id, o.organization_abbr, o.organization_name, t.meeting_count;`
    } else {
        data = await sql<SchoolListAnalytics[]>`SELECT
                o.organization_id,
                o.organization_abbr,
                o.organization_name,
                SUM(t.meeting_count) as meeting_count 
            FROM
                (
                    SELECT
                        om.id,
                        om.organization_id,
                        om.organization_abbr,
                        om.organization_name,
                        COUNT(DISTINCT mf.id) AS meeting_count,
                        om.parent_id
                    FROM
                        organization om
                    INNER JOIN
                        campus cm ON om.id = cm.organization_lid
                    INNER JOIN 
						program_campus pc ON pc.campus_lid = cm.id 
                    INNER JOIN
                        program pm ON pm.id = pc.program_lid
                    LEFT JOIN
                        organization om2 ON om2.id = om.parent_id
                    INNER JOIN 
                        user_organization uo ON 
					CASE WHEN om2.id IS NOT NULL THEN 
						uo.organization_lid = om2.id
					ELSE 
						uo.organization_lid = om.id
					END
                    INNER JOIN
                        master_form mf ON mf.program_lid = pm.id
                    INNER JOIN 
                        form_a fa ON fa.form_lid = mf.id
                    INNER JOIN 
                        form_b fb ON fb.program_lid = pm.id AND fb.acad_year = mf.acad_year AND fb.session_lid = mf.session_lid 
                        AND fb.subject_lid = mf.subject_lid
                    WHERE uo.user_lid = ${userLid}
                    AND pc.active = TRUE AND uo.active = TRUE AND cm.active = TRUE AND om.active = TRUE 
                    AND pm.active = TRUE AND mf.active = TRUE AND uo.active = TRUE
                    AND mf.final_submit = TRUE AND fa.final_submit = TRUE AND fb.active = TRUE
                    GROUP BY
                        om.id, om.organization_id, om.organization_abbr, om.organization_name, om.parent_id
                ) t
            INNER JOIN
                organization o ON (
                    (t.parent_id IS NOT NULL AND o.id = t.parent_id)
                    OR
                    (t.parent_id IS NULL AND o.id = t.id)
                )
            GROUP BY o.organization_id, o.organization_abbr, o.organization_name;`

    }

    return data.length === 0 ? [] : data
}

export async function getprogramsByAcadYearAndUsernameAndOrganizationAbbr(
    acadYear: string,
    userLid: number,
    organizationAbbr: string,
    role: Role,
) {
    let data: Program[] = []
    
    if (role === "role_faculty") {
        data = await sql<Program[]>`
            SELECT DISTINCT
                pm.id, pm.program_id,  
                CASE WHEN pm.program_abbr = ' ' THEN pm.program_name ELSE pm.program_abbr END as program_name, pm.program_code , om.organization_id, om.organization_abbr
            FROM organization om
                INNER JOIN organization om2 ON CASE WHEN om.parent_id IS NOT NULL THEN om.parent_id = om2.id ELSE om.id = om2.id END
                INNER JOIN campus cm ON  om.id = cm.organization_lid
                INNER JOIN user_session_info usi ON usi.campus_lid = cm.id
                INNER JOIN program pm ON pm.id = usi.program_lid
            WHERE
                usi.acad_year = ${acadYear} AND usi.user_lid = ${userLid} AND om2.organization_abbr like ${
                    '%' + organizationAbbr + '%'
                }`
    } else if(role === "role_admin") {
        data = await sql<Program[]>`
            SELECT DISTINCT
                pm.id, pm.program_id,  
                CASE WHEN pm.program_abbr = ' ' THEN pm.program_name ELSE pm.program_abbr END as program_name, pm.program_code , om.organization_id, om.organization_abbr
            FROM organization om
                INNER JOIN organization om2 ON CASE WHEN om.parent_id IS NOT NULL THEN om.parent_id = om2.id ELSE om.id = om2.id END
                INNER JOIN campus cm ON  om.id = cm.organization_lid
                INNER JOIN program_campus pc ON pc.campus_lid = cm.id
                INNER JOIN admin_program ap ON ap.program_lid = pc.program_lid
                INNER JOIN program pm ON pm.id = ap.program_lid
            WHERE
                ap.user_lid = ${userLid} AND om2.organization_abbr like ${
                    '%' + organizationAbbr + '%'
                }`
    } else {
        data = await sql<Program[]>`
                SELECT DISTINCT
                pm.id, pm.program_id,  
                CASE WHEN pm.program_abbr = ' ' THEN pm.program_name ELSE pm.program_abbr END as program_name, pm.program_code , om.organization_id, om.organization_abbr
            FROM organization om
                INNER JOIN campus cm ON  om.id = cm.organization_lid
                INNER JOIN organization om2 ON CASE WHEN om.parent_id IS NOT NULL THEN om.parent_id = om2.id ELSE om.id = om2.id END
                INNER JOIN program_campus pc ON pc.campus_lid = cm.id
                INNER JOIN program pm ON pm.id = pc.program_lid
                INNER JOIN user_organization uo ON 
                    CASE WHEN om.parent_id IS NOT NULL THEN 
                        uo.organization_lid = om.parent_id
                    ELSE 
                        uo.organization_lid = om.id
                    END
            WHERE
                uo.user_lid = ${userLid} AND om2.organization_abbr like ${
                    '%' + organizationAbbr + '%'
                }`
    }

    if (data.length === 0) {
        notFoundError('Program Model', 'Program not found')
    }
    console.log('getprogramsByAcadYearAndUsernameAndOrganizationAbbr::::::::::', data)
    return data
}

export async function getFormBDetailsForAnalytics(acadYear: string, programLid: number) {
    const data = await sql<formBDetails[]>`
                            SELECT DISTINCT
                            CASE WHEN pm.program_abbr = ' ' THEN pm.program_name ELSE pm.program_abbr END as program_name, pm.id as program_lid,
                            fb.acad_year, sesm.acad_session as acad_session, sesm.id as session_lid FROM form_b fb
                            INNER JOIN program pm ON pm.id = fb.program_lid
                            INNER JOIN session_master sesm ON sesm.id = fb.session_lid
                            INNER JOIN master_form mf ON mf.session_lid = fb.session_lid
                            INNER JOIN form_a fa ON fa.form_lid = mf.id
                            WHERE 
                            mf.active = true AND fa.active = true AND fa.final_submit = true AND mf.final_submit = true
                            AND fb.acad_year = ${acadYear}
                            AND fb.program_lid = ${programLid}
    `

    if (data.length === 0) {
        notFoundError('getFormBListById Model', 'Data not found')
    }

    return data[0]
}

export async function getFormBDataForAnalytics(acadYear: string, program: number) {
    const data = await sql<FormBDataDb[]>`
                        SELECT 
                        fbp.id AS point_id, 
                        fbp.point, 
                        fbp.abbr, 
                        sm.id AS subject_id,
                        sm.subject_name,
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
                    GROUP BY 
                        fbp.id, fbp.point, sm.id, sm.subject_name, fbp.abbr;
    `

    if (data.length === 0) {
        notFoundError('getFormBData Model', 'Data not found')
    }

    return data
}

export async function getAbsenteesCountForChart(acadYear: string, programLid: number, subjectLid: number) {
    const data = await sql<absenteesChart[]>`
                        SELECT
                        CONCAT(pu.username, ' - ', pu.first_name, ' ', pu.last_name) AS username,
                        SUM(CASE WHEN mr.name = 'absentees' THEN 1 ELSE 0 END) AS absentees_count
                    FROM
                        master_form mf
                        INNER JOIN form_user fu ON mf.id = fu.form_lid
                        INNER JOIN mpc_role mr ON mr.id = fu.mpc_role_lid
                        INNER JOIN user_session_info usi ON usi.id = fu.user_session_lid
                        INNER JOIN public.user pu ON pu.id = usi.user_lid
                    WHERE
                        mf.subject_lid = ${subjectLid}
                        AND mf.program_lid = ${programLid}
                        AND mf.acad_year = ${acadYear}
                        AND mr.name IN ('attendees', 'absentees')
                    GROUP BY
                        pu.username, pu.first_name, pu.last_name;
                        `

    if (data.length === 0) {
        notFoundError('absenteesCountForChart Model', 'Data not found')
    }

    return data
}

export async function getAnalyticsChartForICA(acadYear: string, programLid: number) {
    const data = await sql`
                            SELECT
                            AVG(average_ica) AS overall_average_ica
                        FROM (
                            SELECT
                                DISTINCT mf.id,
                                pm.point,
                                pm.sub_point,
                                fa.text,
                                AVG(CASE WHEN pm.id = 9 THEN COALESCE(NULLIF(fa.text, ''), '0')::numeric END) AS average_ica
                            FROM
                                point_master pm
                                INNER JOIN form_a fa ON fa.point_lid = pm.id
                                INNER JOIN form_user fu ON fu.form_lid = fa.form_lid
                                INNER JOIN master_form mf ON fu.form_lid = mf.id
                                INNER JOIN program pgm ON pgm.id = mf.program_lid
                            WHERE
                                pgm.id = ${programLid}
                                AND mf.acad_year = ${acadYear}
                            
                            GROUP BY
                                mf.id,
                                pm.point,
                                pm.sub_point,
                                fa.text
                        ) AS subquery;
    `

    if (data.length === 0) {
        notFoundError('getFormBListById Model', 'Data not found')
    }

    return data[0].overall_average_ica as number
}

export async function formBHeaderAnalyticsNew(acadYear: string, programLid: number,user_lid: number, subjectLid: number) {
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

export async function formBvalueAnalyticsNew(acadYear: string, programLid: number, user_lid: number, subjectLid: number) {
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
