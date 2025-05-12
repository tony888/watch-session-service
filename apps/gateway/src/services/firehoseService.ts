import AWS from 'aws-sdk';
import { FIREHOSE_STREAM_NAME, AWS_REGION } from '../../config/config';
import {EventData} from '../models/eventData'
AWS.config.update({ region: AWS_REGION });
const firehose = new AWS.Firehose({ region: AWS_REGION });

export const firehoseService = {
    putRecord: async (data: any) => {
        console.log('Sending data to Firehose with eventData:', data);
        const params: AWS.Firehose.PutRecordInput = {
            DeliveryStreamName: FIREHOSE_STREAM_NAME,
            Record: {
               Data: Buffer.from(JSON.stringify(data)),
            },
        };
        await firehose.putRecord(params).promise();
    },
};