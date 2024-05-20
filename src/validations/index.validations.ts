import * as z from 'zod'

export const programsByAcadYearSchema = z.object({
    query: z.object({
        acadYear: z
            .string({
                required_error: 'Acad Year is required',
            })
            .min(4, {
                message: 'Acad Year must be 4 characters long',
            })
            .max(4, {
                message: 'Acad Year must be 4 characters long',
            }),
    }),
})

export const subjectByProgramSchema = z.object({
    query: z.object({
        programLid: z
            .string({
                required_error: 'Program Id is required',
            })
            .min(1, {
                message: 'Program Id must be at least 1 character long',
            }),
    }),
})

export const masterFormInsertSchema = z.object({
    body: z.array(z.object({
        session_lid: z.union([
            z.string({
                required_error: 'Acad Session is required',
            }),
            z.number({
                required_error: 'Acad Session is required',
            }),
        ]),
        acad_year: z.string({
            required_error: 'Acad Year is required',
        }),
        program_lid: z.union([
            z.string({
                required_error: 'Program Id is required',
            }),
            z.number({
                required_error: 'Program Id is required',
            }),
        ]),
        subject_lid: z.string({
            required_error: 'Subject Id is required',
        }),
        meeting_name: z.string({
            required_error: 'Meeting Name is required',
        }),
        meeting_description: z.string().optional(),
        course_anchor: z.array(z.number()),
        program_anchor: z.array(z.number()),
        meeting_date: z.array(z.string()),
        attendees: z.array(z.number()),
        is_final_submit: z.boolean().default(false),
        is_parent: z.boolean(),
        campus_lid : z.number()
    }))
})
