export type OrganizationMaster = {
    id: number
    organization_id: string
    organization_name: string
    organization_abbr: string
    parent_id: number
    created_by: string
    active: boolean
}

export type CampusMaster = {
    id: number
    campus_id: string
    campus_name: string
    campus_abbr: string
    organization_lid: number
    created_by: string
    active: boolean
}

export type ProgramMaster = {
    id: number
    program_campus_id: number
    program_id: string
    program_name: string
    program_code: string
    organization_lid: number
    campus_lid: number
    change_date: string
    city: string
    created_by: string
    active: boolean
}

export type SessionMaster = {
    id: number
    session_code: string
    acad_session: string
    active: boolean
}

export type SubjectMaster = {
    id: number;
    subject_id: string;
    subject_name: string;
    program_lid: number;
    acad_year: string;
    subject_category_code?: string | null;
    subject_category_name?: string | null;
    subject_descipline_code?: string | null;
    subject_descipline_name?: string | null;
    end_date?: string | null;
    sem_total?: string | null;
    oral_total?: string | null;
    prac_total?: string | null;
    start_date?: string | null;
    subject_abbr: string;
    session_lid: number;
    ica_weightage?: string | null;
    module_credit?: string | null;
    internal_total?: string | null;
    oral_prac_total?: string | null;
    term_work_total?: string | null;
    term_end_weightage?: string | null;
    sap_module_enc_name?: string | null;
    sap_module_enc_desp_name?: string | null;
    active: boolean;
}

export type UserType = {
    id: number;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile_no?: string;
    created_by: string;
    created_date: string;
    modified_by: string;
    modified_date: string;
    active: boolean;
    is_two_factor: boolean;
    disabled: boolean;
  };

export type FacultyMaster = UserType & {
    user_role_id: number;
    role_lid: number;
    dob: string;
    doj: string;
    dol: string;
    campus: string;
    address: string;
    pancard: string;
    institute: string;
    department: string;
    designation: string;
    type_of_emp: string;
    changed_date: string;
    type_of_faculty: string;
}

type UserEventDetails = {
    id: number;
    active: boolean;
    user_lid: number;
    event_lid: number;
    created_by: string;
    created_date: string;
    modified_date: string;
};
  
type EventDetails = {
    id: number;
    active: boolean;
    event_id: string;
    acad_year: null | string;
    acad_month: null | string;
    campus_lid: null | number;
    created_by: string;
    event_name: string;
    program_lid: number;
    session_lid: null | number;
    subject_lid: number;
    created_date: string;
    modified_date: string;
    acad_year_code: null | string;
};

type Event = {
    event_details: EventDetails;
    user_event_details: UserEventDetails[] | null;
};
  
export type EventJsonData = {
    event: Event;
};
  
export type ParentMaster = UserType & {
    user_lid: number;
    role_lid: number;
    role: string;
}

export type StudentMaster = UserType & {
    state: string;
    gender: string;
    address: string | null;
    country: string;
    role_lid: number;
    user_lid: number;
    acad_year: string;
    program_id: string;
    student_id: string;
    father_name: string;
    mother_name: string;
    student_lid: number | null;
    user_role_id: number;
    date_of_birth: string;
    de_reg_reason: string;
    father_mobileno: string;
    mother_mobileno: string;
    student_roll_no: string;
    registration_date: string;
    student_detail_id: number;
    registration_end_date: string;
    registration_start_date: string;
};

export type StudentParentObject = {
    parent_details: ParentMaster[],
    student_details: StudentMaster[]
}

export type StudentRollMaster = {
    user_lid: number;
    username: string;
    roll_no: string;
    changed_date: string;
    acad_session: string;
    acad_year: string;
    student_objid: string;
    campus_id: string;
    program_id: string;
    school_obj: string;
    active: boolean;
}

export type StudentNumberChange = {
    user_lid: number;
    id: number;
    stobjid: string;
    new_number: string;
    old_number: string;
    active: boolean;
}

export type NonEventMaster = {
    id: number;
    user_lid: number;
    acad_year?: string; 
    subject_lid: number;
    session_lid: number;
    campus_lid?: number;
    program_lid: number;
    organization_lid?: number;
    enroll_type?: string;
    company_code?: string;
    credit_point?: string;
    acad_year_code?: string;
    enroll_de_enroll?: string;
    created_by: string;
    created_date: string; 
    modified_date: string; 
    active : boolean;
}

export type AdminProgram = {
    
}