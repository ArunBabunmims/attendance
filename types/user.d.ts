export type Role =
    | "role_student"
    | "role_faculty"
    | "role_admin"
    | "role_parent"
    | "role_exam"
    | "role_ar"
    | "role_area_incharge"
    | "role_cord"
    | "role_counselor"
    | "role_dean"
    | "role_hod"
    | "role_it"
    | "role_library"
    | "role_support_admin"
    | "role_central"

export type Anchor = {
    user_session_lid: number
    username: string
    first_name: string
    last_name: string
    campus_id: string
    campus_name: string
    campus_abbr: string
}


export type UserAndCampus = {
    user_session_lid: number;
    username: string;
    campus_id: string;
    last_name: string;
    first_name: string;
    campus_abbr: string;
    campus_name: string;
};

export type Attendees = {
    meeting_lid: number;
    user_session_lid: number;
    user_lid: number;
    username: string;
    campus_id: string;
    last_name: string;
    first_name: string;
    last_name: string;
};

export type countCourse = {
    count : number;
    date_array : string;
    ca_array : string[];
}
