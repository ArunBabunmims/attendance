import { ZodIssue } from 'zod'
import { HTTP_STATUS } from '../src/constants/http.constants'

export type ErrorObject = {
    message: string
    moduleName: string
    status: HTTP_STATUS
    httpStatus?: valueof<typeof HTTP_STATUS>
    error?: any
    validationErrors?: ZodIssue[]
}
