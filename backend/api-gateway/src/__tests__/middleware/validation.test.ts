import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate } from '../../middleware/validation';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
      path: '/test',
      method: 'POST'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('Body Validation', () => {
    it('should pass validation with valid data', () => {
      const schema = {
        body: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().min(8).required()
        })
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid email', () => {
      const schema = {
        body: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().min(8).required()
        })
      };

      mockReq.body = {
        email: 'invalid-email',
        password: 'password123'
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          details: expect.objectContaining({
            body: expect.any(Array)
          })
        })
      );
    });

    it('should fail validation with missing required field', () => {
      const schema = {
        body: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().min(8).required()
        })
      };

      mockReq.body = {
        email: 'test@example.com'
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation with password too short', () => {
      const schema = {
        body: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().min(8).required()
        })
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'short'
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Query Validation', () => {
    it('should validate query parameters', () => {
      const schema = {
        query: Joi.object({
          page: Joi.number().integer().min(1).required(),
          limit: Joi.number().integer().min(1).max(100).required()
        })
      };

      mockReq.query = {
        page: '1',
        limit: '50'
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should fail with invalid query parameters', () => {
      const schema = {
        query: Joi.object({
          page: Joi.number().integer().min(1).required()
        })
      };

      mockReq.query = {
        page: '0'
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Params Validation', () => {
    it('should validate route parameters', () => {
      const schema = {
        params: Joi.object({
          id: Joi.string().uuid().required()
        })
      };

      mockReq.params = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should fail with invalid UUID', () => {
      const schema = {
        params: Joi.object({
          id: Joi.string().uuid().required()
        })
      };

      mockReq.params = {
        id: 'invalid-uuid'
      };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Multiple Validations', () => {
    it('should validate body, query, and params together', () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required()
        }),
        query: Joi.object({
          page: Joi.number().integer().min(1).default(1)
        }),
        params: Joi.object({
          id: Joi.string().uuid().required()
        })
      };

      mockReq.body = { name: 'Test' };
      mockReq.query = { page: '1' };
      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should collect all validation errors', () => {
      const schema = {
        body: Joi.object({
          email: Joi.string().email().required()
        }),
        params: Joi.object({
          id: Joi.string().uuid().required()
        })
      };

      mockReq.body = { email: 'invalid' };
      mockReq.params = { id: 'invalid' };

      const middleware = validate(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            body: expect.any(Array),
            params: expect.any(Array)
          })
        })
      );
    });
  });
});
