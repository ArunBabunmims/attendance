import { logger } from '@config/logger'

export async function sendEmail(toEmail: string[], subject: string, message: string) {
    const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL
    if (!NOTIFICATION_URL) return console.error('Notification service URL not found')

    const body = { toEmail, subject, message, fromAddress: 'noreply-portal@svkm.ac.in' }
    console.log(JSON.stringify(body))
    try {
        const response = await fetch(`${NOTIFICATION_URL}/send-email-enc`, {
            method: 'POST',
            body: JSON.stringify(body),
        })
        console.log('response:::::::::', response)

        logger.info('Response from notification service', response.status, response.statusText)
        logger.info(`Email sent to ${toEmail.join(', ')}`)
    } catch (error) {
        logger.error('Error in sending email', error)
    }
}
