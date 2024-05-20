import { UserAndCampus } from './user'

export type UserRoleResult = {
    user_session_lid: number;
    username: string;
    first_name: string;
    last_name: string;
    program_id: number;
    program_name: string;
    program_code: string;
    organization_id: number;
    organization_name: string;
    organization_abbr: string;
    campus_id: number;
    campus_name: string;
    campus_abbr: string;
    is_program_anchor: boolean;
    is_course_anchor: boolean;
};


export type MasterMeetingBySubject = {
    program_lid: number
    subject_lid: number
    acad_year: string
    subject_id: string
    subject_name: string
    subject_abbr: string
    program_id: string
    program_name: string
    program_code: string
}

export type MasterMeetingList = {
    meeting_id: number
    meeting_name: string
    meeting_date: string
    final_submit: boolean
    program_lid: number
    subject_lid: number
    acad_year: string
    acad_session: string
    subject_id: string
    subject_name: string
    subject_abbr: string
    program_id: string
    program_name: string
    program_code: string
}

export type MeetingMaster = {
    meeting_id: number
    meeting_name: string
    meeting_date: string
    meeting_date_timestamp: string;
    program_lid: number
    subject_lid: number
    acad_year: string
    session_lid: number
    acad_session: string
    subject_id: string
    subject_name: string
    subject_abbr: string
    program_id: string
    program_name: string
    program_code: string
}

export type MPCRoleJson = {
    course_anchor: UserAndCampus[]
    program_anchor: UserAndCampus[]
    attendees: UserAndCampus[]
    absentees: UserAndCampus[]
}

export type MPCRoleJsonAgg = {
    aggregated_json: MPCRoleJson
}

export type Options = {
    value: number
    label: string
    selected: boolean
}

export type AnchorsForMasterFormEdit = {
    course_anchor: Options[]
    program_anchor: Options[]
}

export type masterdate = {
    meeting_id: number,
    meeting_name: string,
    meeting_date: string
}

export type FormAType = {
    header: {
        id: number;
        name: string;
    }[];
    points: {
        id: number;
        point: string;
        subPoint: string;
        type: string;
    }[];
}

export type Point = {
    id: number;
    point: string;
    subPoint: string;
    type: string;
}

export type FormASummaryType = {
    header: {
        id: number;
        name: string;
    }[];
    data: {
        point_id: number;
		campus_id: string;
		point: string;	
		sub_point: string;
		campus_name: string;
		type: string;
		text: string;
    }[];
}

export type FormAList = {
    meeting_id: number;
    meeting_name: string;
    program_name: string;
    subject_name: string;
    acad_year: string;
    final_submit: boolean;
};

export type FormADetail = {
    meeting_data : {
        acad_year : string;
        meeting_id: number;
        acad_session: string;
        meeting_date: string;
        program_name: string;
        subject_name : string
    }[];
    points: {
        id: number;
        point: string;
        subPoint: string;
        campus_lid: number;
        campus_name: string;
        type: string;
        text: string
    }[];
    header : {
        id: number;
        name : string;
    }[]
}

export type FormBList = {
    program_lid: number;
    program_name: string;
    acad_year: string;
    acad_session: string;
    session_lid: number;
    final_submit: boolean;
    subject_name: string;
    subject_lid: number;
};

export type formBDetails = {
    program_name: string;
    program_lid: number;
    acad_year: string;
    acad_session: string;
    session_lid: number;
    subject_name: string;
    subject_lid: number;
}

export type FormBDataDb = {
    point_id: number;
    point: string;
    abbr: string;
    subject_id: number;
    subject_name: string;
    text: string;
}

export type GroupedFormBData = {
    [key: string]: FormBDataDb[]
}

export type SchoolListAnalytics = {
    organization_id: number;
    organization_abbr: string;
    organization_name: string;
    meeting_count: number
}

export type absenteesChart = {
    username : string;
    absentees_count : number;
}

export type icaChart = {
    overall_average_ica : number;
}

export type MasterFormWithUsers = {
    users: {
        name: string
        email: string
    }[]
    master_form: {
        acad_year: string
        meeting_id: number
        acad_session: string
        meeting_date: string
        meeting_name: string
        program_code: string
        program_name: string
        subject_abbr: string
        subject_name: string
        meeting_description: string
    }
}