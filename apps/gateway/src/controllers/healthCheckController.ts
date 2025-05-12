import { Request, Response } from 'express';

export const healthCheckController = async (req: Request, res: Response) => {
    try {
        res.status(200);
        res.send('OK');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Error');
    }
};