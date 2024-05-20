import sql from '@config/db'
import { logger } from '@config/logger'
import { writeFile } from 'fs/promises'
import crypto from 'crypto'

import {
    CampusMaster,
    OrganizationMaster,
    FacultyMaster,
    ProgramMaster,
    SessionMaster,
    SubjectMaster,
    EventJsonData,
    AdminProgram,
} from 'types/sap-master'

export async function insertOrganizationMaster(organizationMaster: OrganizationMaster[]) {
    try {
        const data = await sql`
                INSERT INTO organization ${sql(
                    organizationMaster,
                    'id',
                    'organization_id',
                    'organization_name',
                    'organization_abbr',
                    'parent_id',
                    'active',
                )}
                ON CONFLICT (id) DO UPDATE SET
                organization_id = EXCLUDED.organization_id,
                organization_name = EXCLUDED.organization_name,
                organization_abbr = EXCLUDED.organization_abbr,
                parent_id = EXCLUDED.parent_id,
                active = EXCLUDED.active,
                modified_date = now()
            `
        logger.info('insertOrganizationMaster: ', data)
    } catch (error) {
        logger.error('Error in insertOrganizationMaster: ', error)
    }
}

export async function insertCampusMaster(campusMaster: CampusMaster[]) {
    try {
        const data = await sql`
                INSERT INTO campus ${sql(campusMaster, 'id', 'campus_id', 'campus_name', 'campus_abbr', 'organization_lid', 'active')}
                ON CONFLICT (id) DO UPDATE SET
                campus_id = EXCLUDED.campus_id,
                campus_name = EXCLUDED.campus_name,
                campus_abbr = EXCLUDED.campus_abbr,
                organization_lid = EXCLUDED.organization_lid,
                active = EXCLUDED.active,
                modified_date = now()
            `
        logger.info('insertCampusMaster: ', data)
    } catch (error) {
        logger.error('Error in insertCampusMaster: ', error)
    }
}

export async function insertProgramMaster(data: ProgramMaster[]) {
    try {
        logger.info('INSERTING PROGRAM>>>> ')
        await sql`SELECT * FROM sap_program_master(${data as any})`
        logger.info('INSERTED PROGRAM>>>> ')
    } catch (error) {
        logger.error('Error in insertprogramMaster: ', error)
    }
}

export async function insertSessionMaster(data: SessionMaster[]) {
    try {
        logger.info('INSERTING SESSION>>>> ')
        await sql`
            INSERT INTO session_master${sql(data, 'id', 'session_code', 'acad_session', 'active')}
            ON CONFLICT (id) DO UPDATE SET
            active = EXCLUDED.active,
            modified_date = now()
        `
        logger.info('INSERTED SESSION>>>> ')
    } catch (error) {
        logger.error('Error in insertSubjectMaster: ', error)
    }
}

export async function insertSubjectMaster(data: SubjectMaster[]) {
    try {
        logger.info('INSERTING SUBJECT>>>> ')
        await sql`SELECT * FROM sap_subject_master(${data as any})`
        logger.info('INSERTED SUBJECT>>>> ')
    } catch (error) {
        logger.error('Error in insertSubjectMaster: ', error)
    }
}

export async function insertPermanentFacultyMaster(data: FacultyMaster[]) {
    try {
        logger.info('INSERTING PERMANENT FACULTY>>>> ')
        await sql`SELECT * FROM sap_faculty_master(${data as any})`
        logger.info('INSERTED PERMANENT FACULTY>>>> ')
    } catch (error) {
        logger.error('Error in PERMANENT FACULTY: ', error)
    }
}

export async function insertVisitingFacultyMaster(data: FacultyMaster[]) {
    try {
        logger.info('INSERTING VISITING FACULTY>>>> ')
        await sql`SELECT * FROM sap_faculty_master(${data as any})`
        logger.info('INSERTED VISITING FACULTY>>>> ')
    } catch (error) {
        logger.error('Error in VISITING FACULTY: ', error)
    }
}

export async function insertStudentEventMaster(data: EventJsonData[]) {
    try {
        logger.info('INSERTING STUDENT EVENT MASTER>>>> ')
        await sql`SELECT * FROM create_user_session_info(${data as any})`
        logger.info('INSERTED STUDENT EVENT MASTER>>>> ')
    } catch (error) {
        logger.error('Error in STUDENT EVENT MASTER: ', error)
    }
}

export async function insertAdminProgram(data: any[]) {
    try {
        logger.info('INSERTING ADMIN PROGRAM>>>> ')
        await sql`SELECT * FROM create_admin_master(${data})`
        logger.info('INSERTED ADMIN PROGRAM>>>> ')
    } catch (error) {
        logger.error('Error in ADMIN PROGRAM: ', error)
    }
}

export async function insertSpecialUser(data: any[]) {
    try {
        logger.info('INSERTING SPECIAL USER>>>> ')
        await sql`SELECT * FROM create_special_user(${data})`
        logger.info('INSERTED SPECIAL USER>>>> ')
    } catch (error) {
        logger.error('Error in SPECIAL USER: ', error)
    }
}