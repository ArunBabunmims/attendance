
import { UserAndCampus } from './user'

// Arun
export type UserAttendanceList = {
    id: number;
    event_id: number;
    event_name: string;
    start_time: string;
    end_time: string;
    status: boolean
};
export type UserAttendanceListApp = {
    id: number;
    event_id: number;
    event_name: string;
    start_time: string;
    end_time: string;
    status: boolean;
    student_count : number;
};

export type UserStudentAttendanceList = {
    username: string;
    first_name: string;
    last_name: string;
    student_roll_no: string;
};

export type Student = {
    status: boolean;
    username: string;
    last_name: string;
    first_name: string;
    student_roll_no: string;
}

export type Lecture = {
    id: number;
    end_time: string;
    event_name: string;
    start_time: string;
    student_count: number;
}

export type CombinedResult = {
    lecture: Lecture;
    student_list: Student[];
}