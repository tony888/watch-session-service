import { Request, Response } from 'express';
import { firehoseService } from '../services/firehoseService';  
import { EventDataSchema, EventDataWithTimestamp } from '../models/eventData';

export const watchController = async (req: Request, res: Response) => {
    try {
        // Validate the request body using Zod schema
        const validatedData = EventDataSchema.parse(req.body);
        
        // Create event data with timestamp
        const eventData: EventDataWithTimestamp = {
            ...validatedData,
            timestamp: Date.now(),
        };

        await firehoseService.putRecord(eventData);
        res.send('Event sent to Firehose');
    } catch (err) {
        // Handle Zod validation errors
        if (err instanceof Error && err.name === 'ZodError') {
            console.error('Validation error:', err);
            res.status(400).json({
                error: 'Invalid request data',
                details: (err as any).errors
            });
            return;
        }

        // Handle other errors
        console.error('Error sending data to Firehose:', err);
        res.status(500).send('Error sending data to Firehose');
    }
};
