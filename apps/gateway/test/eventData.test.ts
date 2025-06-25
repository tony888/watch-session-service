import { EventDataSchema } from '../src/models/eventData';
import { z } from 'zod';

describe('EventDataSchema', () => {
  describe('Valid data', () => {
    it('should validate correct event data', () => {
      const validData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 50,
      };

      const result = EventDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate with progress at minimum boundary (0)', () => {
      const validData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 0,
      };

      const result = EventDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with progress at maximum boundary (100)', () => {
      const validData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 100,
      };

      const result = EventDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with optional timestamp', () => {
      const validData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 50,
        timestamp: 1640995200000,
      };

      const result = EventDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should strip unknown fields', () => {
      const dataWithExtraFields = {
        userId: 'user123',
        contentId: 'content456',
        progress: 50,
        unknownField: 'should be stripped',
        anotherUnknown: 123,
      };

      const result = EventDataSchema.safeParse(dataWithExtraFields);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          userId: 'user123',
          contentId: 'content456',
          progress: 50,
        });
        expect(result.data).not.toHaveProperty('unknownField');
        expect(result.data).not.toHaveProperty('anotherUnknown');
      }
    });
  });

  describe('Invalid data', () => {
    it('should reject missing userId', () => {
      const invalidData = {
        contentId: 'content456',
        progress: 50,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['userId'],
            code: 'invalid_type',
          })
        );
      }
    });

    it('should reject empty userId', () => {
      const invalidData = {
        userId: '',
        contentId: 'content456',
        progress: 50,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['userId'],
            code: 'too_small',
            message: 'User ID is required',
          })
        );
      }
    });

    it('should reject missing contentId', () => {
      const invalidData = {
        userId: 'user123',
        progress: 50,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['contentId'],
            code: 'invalid_type',
          })
        );
      }
    });

    it('should reject empty contentId', () => {
      const invalidData = {
        userId: 'user123',
        contentId: '',
        progress: 50,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['contentId'],
            code: 'too_small',
            message: 'Content ID is required',
          })
        );
      }
    });

    it('should reject missing progress', () => {
      const invalidData = {
        userId: 'user123',
        contentId: 'content456',
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['progress'],
            code: 'invalid_type',
          })
        );
      }
    });

    it('should reject progress less than 0', () => {
      const invalidData = {
        userId: 'user123',
        contentId: 'content456',
        progress: -1,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['progress'],
            code: 'too_small',
          })
        );
      }
    });

    it('should reject progress greater than 100', () => {
      const invalidData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 101,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['progress'],
            code: 'too_big',
            message: 'Progress must be between 0 and 100',
          })
        );
      }
    });

    it('should reject non-numeric progress', () => {
      const invalidData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 'fifty',
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['progress'],
            code: 'invalid_type',
          })
        );
      }
    });

    it('should reject non-string userId', () => {
      const invalidData = {
        userId: 123,
        contentId: 'content456',
        progress: 50,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['userId'],
            code: 'invalid_type',
          })
        );
      }
    });

    it('should reject non-string contentId', () => {
      const invalidData = {
        userId: 'user123',
        contentId: 456,
        progress: 50,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['contentId'],
            code: 'invalid_type',
          })
        );
      }
    });

    it('should handle multiple validation errors', () => {
      const invalidData = {
        userId: '',
        contentId: '',
        progress: 150,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
        expect(result.error.issues.map(issue => issue.path[0])).toContain('userId');
        expect(result.error.issues.map(issue => issue.path[0])).toContain('contentId');
        expect(result.error.issues.map(issue => issue.path[0])).toContain('progress');
      }
    });

    it('should reject completely empty object', () => {
      const invalidData = {};

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
      }
    });

    it('should reject null values', () => {
      const invalidData = {
        userId: null,
        contentId: null,
        progress: null,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
      }
    });

    it('should reject undefined values', () => {
      const invalidData = {
        userId: undefined,
        contentId: undefined,
        progress: undefined,
      };

      const result = EventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
      }
    });
  });

  describe('Type inference', () => {
    it('should infer correct TypeScript types', () => {
      const validData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 50,
      };

      const result = EventDataSchema.parse(validData);
      
      // TypeScript type checking
      const userId: string = result.userId;
      const contentId: string = result.contentId;
      const progress: number = result.progress;
      const timestamp: number | undefined = result.timestamp;

      expect(userId).toBe('user123');
      expect(contentId).toBe('content456');
      expect(progress).toBe(50);
      expect(timestamp).toBeUndefined();
    });
  });
});
