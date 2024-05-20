import { getMetingsAndUsersForNotification } from "@model/master.model";
import { sendEmail } from "./email";

export async function notifyUsersForMeeting() {
    const meetings = await getMetingsAndUsersForNotification()
    console.log(meetings)

    for(const meeting of meetings) {
        const emails = [...new Set(meeting.users.map(user => user.email))]
        
        console.log(`Notifying users ${emails.join(', ')} for meeting ${meeting.master_form.meeting_name}`)
        await sendEmail(emails, 'Reminder For MPC Meeting', `<p>Dear Sir/Madam,</p><p>&nbsp;&nbsp;&nbsp;This is a gentle reminder that we have a meeting for <strong>${meeting.master_form.subject_name} (${meeting.master_form.subject_abbr})</strong> on <strong>${meeting.master_form.meeting_date}</strong>.</p><p>&nbsp;&nbsp;&nbsp;Below is the provided description of the meeting:</p><p><strong>&nbsp;&nbsp;&nbsp;${meeting.master_form.meeting_description}</strong></p><p>Regards,<br>Portal</p>`)
    }
}