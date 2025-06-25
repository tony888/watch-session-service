import { z } from 'zod';

export const EventDataSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    contentId: z.string().min(1, "Content ID is required"),
    progress: z.number().min(0).max(100, "Progress must be between 0 and 100"),
    timestamp: z.number().optional()
});

export type EventData = z.infer<typeof EventDataSchema>;

export interface EventDataWithTimestamp extends EventData {
    timestamp: number;
}