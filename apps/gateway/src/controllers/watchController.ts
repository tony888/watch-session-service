import { Request, Response } from 'express';
import { firehoseService } from '../services/firehoseService';  
import { EventData } from '../models/eventData';
export const watchController = async (req: Request, res: Response) => {
    const eventData= {
        userId: req.body.userId,
        contentId: req.body.contentId,
        progress: req.body.progress,
        ...req.body,
        timestamp: Date.now(),
    };
    //const eventData = req.body;
    try {
        await firehoseService.putRecord(eventData);
        res.send('Event sent to Firehose');
    } catch (err) {
        console.error('Error sending data to Firehose:', err);
        res.status(500).send('Error sending data to Firehose');
    }
};
