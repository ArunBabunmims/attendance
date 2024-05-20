import { getEmailBySessionLid } from "@model/master.model";
import { FormADetail, FormAType, FormBDataDb, GroupedFormBData } from "types/mpc";
import { sendEmail } from "./email";

export function groupByPoint(jsonArray: FormBDataDb[]): GroupedFormBData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return jsonArray.reduce((result: any, item) => {
	  const key = `${item.point_id}`;
	  if (!result[key]) {
		result[key] = [];
	  }
	  result[key].push(item);
	  return result as GroupedFormBData;
	}, {});
}

export function groupByPointFormA(jsonArray: FormADetail | FormAType) {
	console.log("groupByPointFormA jsonArray : ",jsonArray);
	
	return jsonArray.points.reduce((result: any, item) => {
		const key = `${item.id}`;
		if (!result[key]) {
			result[key] = [];
		}
		result[key].push(item);
		return result;
	}, {});
}

export async function sendMPCMeetingMail(json : any){

	console.log("masterFormInsert : ",json.body);
    const combinedArray = [
        ...json.body.course_anchor,
        ...json.body.program_anchor,
        ...json.body.attendees
    ];
    
    const email = await getEmailBySessionLid(combinedArray);
    console.log("email : ",email);
    const emails = [...new Set(email.map(user => user.email))]
    const subject = `Reminder For MPC Meeting`;
    const message = `<p>Dear Sir/Madam</p><p>&nbsp;&nbsp;&nbsp; This is a gentle reminder that we have a meeting of MPC Name : ${json.body.meeting_name},DATE : ${json.body.meeting_date}</p><p><p><b>Meeting Link & Password :${json.body.meeting_description}</p><b>MPC PORTAL LINK :</b> https://lms.svkm.ac.in/login</p><p>Regards,<br>Portal</p>`
	const encMessgae = encodeURIComponent(message);
    await sendEmail(emails,subject,encMessgae);
}
  