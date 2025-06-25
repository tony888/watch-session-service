import { Request, Response } from 'express';
import { watchController } from '../src/controllers/watchController';
import { firehoseService } from '../src/services/firehoseService';

// Mock the firehoseService
jest.mock('../src/services/firehoseService', () => ({
  firehoseService: {
    putRecord: jest.fn(),
  },
}));

const mockFirehoseService = firehoseService as jest.Mocked<typeof firehoseService>;

describe('watchController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {};
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Valid requests', () => {
    it('should successfully process valid watch data', async () => {
      const validData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 50,
      };

      mockRequest.body = validData;
      mockFirehoseService.putRecord.mockResolvedValueOnce(undefined);

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockFirehoseService.putRecord).toHaveBeenCalledWith({
        ...validData,
        timestamp: expect.any(Number),
      });
      expect(mockResponse.send).toHaveBeenCalledWith('Event sent to Firehose');
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should add timestamp to the event data', async () => {
      const validData = {
        userId: 'user123',
        contentId: 'content456', 
        progress: 75,
      };

      mockRequest.body = validData;
      mockFirehoseService.putRecord.mockResolvedValueOnce(undefined);

      const beforeTime = Date.now();
      await watchController(mockRequest as Request, mockResponse as Response);
      const afterTime = Date.now();

      expect(mockFirehoseService.putRecord).toHaveBeenCalledWith({
        ...validData,
        timestamp: expect.any(Number),
      });

      const calledData = mockFirehoseService.putRecord.mock.calls[0][0];
      expect(calledData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(calledData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle progress value at boundaries', async () => {
      const testCases = [
        { progress: 0 },
        { progress: 100 },
      ];

      for (const testCase of testCases) {
        const validData = {
          userId: 'user123',
          contentId: 'content456',
          ...testCase,
        };

        mockRequest.body = validData;
        mockFirehoseService.putRecord.mockResolvedValueOnce(undefined);

        await watchController(mockRequest as Request, mockResponse as Response);

        expect(mockFirehoseService.putRecord).toHaveBeenCalledWith({
          ...validData,
          timestamp: expect.any(Number),
        });
        expect(mockResponse.send).toHaveBeenCalledWith('Event sent to Firehose');

        jest.clearAllMocks();
      }
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for missing userId', async () => {
      const invalidData = {
        contentId: 'content456',
        progress: 50,
      };

      mockRequest.body = invalidData;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['userId'],
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should return 400 for empty userId', async () => {
      const invalidData = {
        userId: '',
        contentId: 'content456',
        progress: 50,
      };

      mockRequest.body = invalidData;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['userId'],
            message: 'User ID is required',
          }),
        ]),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should return 400 for missing contentId', async () => {
      const invalidData = {
        userId: 'user123',
        progress: 50,
      };

      mockRequest.body = invalidData;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['contentId'],
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should return 400 for empty contentId', async () => {
      const invalidData = {
        userId: 'user123',
        contentId: '',
        progress: 50,
      };

      mockRequest.body = invalidData;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['contentId'],
            message: 'Content ID is required',
          }),
        ]),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should return 400 for missing progress', async () => {
      const invalidData = {
        userId: 'user123',
        contentId: 'content456',
      };

      mockRequest.body = invalidData;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['progress'],
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should return 400 for progress less than 0', async () => {
      const invalidData = {
        userId: 'user123',
        contentId: 'content456',
        progress: -1,
      };

      mockRequest.body = invalidData;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['progress'],
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should return 400 for progress greater than 100', async () => {
      const invalidData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 101,
      };

      mockRequest.body = invalidData;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['progress'],
            message: 'Progress must be between 0 and 100',
          }),
        ]),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid progress type', async () => {
      const invalidData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 'invalid',
      };

      mockRequest.body = invalidData;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['progress'],
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should return 400 for multiple validation errors', async () => {
      const invalidData = {
        userId: '',
        contentId: '',
        progress: 150,
      };

      mockRequest.body = invalidData;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.arrayContaining([
          expect.objectContaining({ path: ['userId'] }),
          expect.objectContaining({ path: ['contentId'] }),
          expect.objectContaining({ path: ['progress'] }),
        ]),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });
  });

  describe('Firehose service errors', () => {
    it('should return 500 when firehose service fails', async () => {
      const validData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 50,
      };

      mockRequest.body = validData;
      mockFirehoseService.putRecord.mockRejectedValueOnce(new Error('Firehose error'));

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockFirehoseService.putRecord).toHaveBeenCalledWith({
        ...validData,
        timestamp: expect.any(Number),
      });
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Error sending data to Firehose');
    });

    it('should log the error when firehose service fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const validData = {
        userId: 'user123',
        contentId: 'content456',
        progress: 50,
      };

      mockRequest.body = validData;
      const firehoseError = new Error('Firehose connection failed');
      mockFirehoseService.putRecord.mockRejectedValueOnce(firehoseError);

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Error sending data to Firehose:', firehoseError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', async () => {
      mockRequest.body = {};

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid request data',
        details: expect.any(Array),
      });
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should handle undefined request body', async () => {
      mockRequest.body = undefined;

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockFirehoseService.putRecord).not.toHaveBeenCalled();
    });

    it('should ignore extra fields in request body', async () => {
      const dataWithExtraFields = {
        userId: 'user123',
        contentId: 'content456',
        progress: 50,
        extraField1: 'should be ignored',
        extraField2: 123,
      };

      mockRequest.body = dataWithExtraFields;
      mockFirehoseService.putRecord.mockResolvedValueOnce(undefined);

      await watchController(mockRequest as Request, mockResponse as Response);

      expect(mockFirehoseService.putRecord).toHaveBeenCalledWith({
        userId: 'user123',
        contentId: 'content456',
        progress: 50,
        timestamp: expect.any(Number),
      });
      expect(mockResponse.send).toHaveBeenCalledWith('Event sent to Firehose');
    });
  });
});
