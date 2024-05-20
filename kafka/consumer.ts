import { logger } from '@config/logger'
import { insertSapDataFunctions, tables } from '@constants/topics.constants'
import { ConsumerSubscribeTopics, Kafka } from 'kafkajs'

const clientId = 'mpc'
const brokers = [process.env.KAFKA_BROKER as string]

const kafka = new Kafka({
    clientId: clientId,
    brokers: brokers,
})

const consumer = kafka.consumer({ groupId: clientId })

export const consume = async () => {
    const topicArray: ConsumerSubscribeTopics = {
        topics: Object.values(tables),
        fromBeginning: true
      }
      
    logger.info('consuming topic: ', topicArray)

    await consumer.disconnect()
    await consumer.connect()
    // first, we wait for the client to connect and subscribe to the given topic
    await consumer.subscribe(topicArray)
    await consumer.run({
        // this function is called every time the consumer gets a new message
        eachMessage: async ({ message, topic }) => {
            // if(!message.value) await consumer.disconnect();
            // here, we just log the message to the standard output
            // logger.info(`received message: ${message.value}`)
            if (!message.value) return
            await (insertSapDataFunctions as { [key: string]: (data: any) => Promise<any> })[topic](
                JSON.parse(message.value.toString()) as any,
            )
        },
    })
}
