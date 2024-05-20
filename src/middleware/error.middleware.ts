import { NextFunction, Request, Response } from 'express'
import { CustomError } from '@utils/error/customError'
import { AnyZodObject, ZodError } from 'zod'
import { logger } from '@config/logger'
import { HTTP_STATUS } from '@constants/http.constants'

export const customErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err)
    console.log('err >>> ', err)

    if (err instanceof CustomError) {
        return res.status(err.httpStatus).json({
            message: err.message,
            status: err.status,
            code: err.httpStatus,
            validationErrors: err.validationErrors,
            errorId: crypto.randomUUID()
        })
    } else {
        // Provide more details in the response during development
        const errorResponse =
            process.env.NODE_ENV === 'production'
                ? { message: 'Internal Server Error', status: 500, errorId: crypto.randomUUID() }
                : { message: err.message, status: 500, stack: err.stack, errorId: crypto.randomUUID() }

        return res.status(500).json(errorResponse)
    }
}

// Custom async error handler middleware
export const asyncErrorHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }

export const validate = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        })
        return next()
    } catch (error) {
        logger.error(error)
        if (error instanceof ZodError) {
            throw new CustomError({
                moduleName: 'validate',
                status: HTTP_STATUS.BAD_REQUEST,
                message: error.issues[0].message,
                error: error,
                validationErrors: error.issues,
            })
        } else {
            throw new CustomError({
                moduleName: 'validate',
                status: HTTP_STATUS.BAD_REQUEST,
                message: 'validation error',
                error: error,
            })
        }
    }
}
