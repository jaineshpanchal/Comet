/**
 * Swagger/OpenAPI Schema Definitions
 * Reusable schemas for API documentation
 */

export const swaggerSchemas = {
  // Common schemas
  ApiResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Indicates if the request was successful'
      },
      data: {
        type: 'object',
        description: 'Response data payload'
      },
      message: {
        type: 'string',
        description: 'Human-readable response message'
      },
      error: {
        type: 'string',
        description: 'Error message if request failed'
      },
      details: {
        type: 'object',
        description: 'Additional error details or validation errors'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'ISO 8601 timestamp of the response'
      },
      path: {
        type: 'string',
        description: 'API endpoint path that was called'
      },
      statusCode: {
        type: 'integer',
        description: 'HTTP status code'
      }
    },
    required: ['success', 'timestamp', 'path', 'statusCode']
  },

  // User schemas
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique user identifier'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      username: {
        type: 'string',
        description: 'Unique username (alphanumeric, 3-30 characters)'
      },
      firstName: {
        type: 'string',
        description: 'User first name'
      },
      lastName: {
        type: 'string',
        description: 'User last name'
      },
      avatar: {
        type: 'string',
        format: 'uri',
        nullable: true,
        description: 'URL to user avatar image'
      },
      role: {
        type: 'string',
        enum: ['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER', 'VIEWER'],
        description: 'User role determining permissions'
      },
      isActive: {
        type: 'boolean',
        description: 'Whether the user account is active'
      },
      isEmailVerified: {
        type: 'boolean',
        description: 'Whether the email has been verified'
      },
      lastLoginAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Last login timestamp'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Account creation timestamp'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last account update timestamp'
      }
    }
  },

  // Authentication schemas
  RegisterRequest: {
    type: 'object',
    required: ['email', 'username', 'firstName', 'lastName', 'password', 'confirmPassword'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
        description: 'Valid email address'
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9]+$',
        example: 'johndoe',
        description: 'Alphanumeric username'
      },
      firstName: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        example: 'John',
        description: 'User first name'
      },
      lastName: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        example: 'Doe',
        description: 'User last name'
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 128,
        format: 'password',
        example: 'SecurePass123!',
        description: 'Password (minimum 8 characters)'
      },
      confirmPassword: {
        type: 'string',
        format: 'password',
        example: 'SecurePass123!',
        description: 'Password confirmation (must match password)'
      }
    }
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
        description: 'User email address'
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'SecurePass123!',
        description: 'User password'
      },
      rememberMe: {
        type: 'boolean',
        default: false,
        description: 'Whether to extend session duration'
      }
    }
  },

  AuthTokens: {
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        description: 'JWT access token for authenticated requests'
      },
      refreshToken: {
        type: 'string',
        description: 'Refresh token for obtaining new access tokens'
      },
      expiresIn: {
        type: 'integer',
        description: 'Access token expiration time in seconds'
      },
      tokenType: {
        type: 'string',
        default: 'Bearer',
        description: 'Token type (always Bearer)'
      }
    }
  },

  LoginResponse: {
    allOf: [
      { $ref: '#/components/schemas/ApiResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              tokens: { $ref: '#/components/schemas/AuthTokens' }
            }
          }
        }
      }
    ]
  },

  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword', 'confirmPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        format: 'password',
        description: 'Current password for verification'
      },
      newPassword: {
        type: 'string',
        minLength: 8,
        format: 'password',
        description: 'New password (minimum 8 characters)'
      },
      confirmPassword: {
        type: 'string',
        format: 'password',
        description: 'New password confirmation'
      }
    }
  },

  ValidationError: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      error: {
        type: 'string',
        example: 'Validation failed'
      },
      message: {
        type: 'string',
        example: 'Invalid request data'
      },
      details: {
        type: 'object',
        properties: {
          body: {
            type: 'array',
            items: {
              type: 'string',
              example: '"email" must be a valid email'
            }
          },
          query: {
            type: 'array',
            items: { type: 'string' }
          },
          params: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      timestamp: {
        type: 'string',
        format: 'date-time'
      },
      path: {
        type: 'string',
        example: '/api/auth/register'
      },
      statusCode: {
        type: 'integer',
        example: 400
      }
    }
  },

  UnauthorizedError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Authentication required' },
      message: { type: 'string', example: 'Invalid or expired token' },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
      statusCode: { type: 'integer', example: 401 }
    }
  },

  ForbiddenError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Insufficient permissions' },
      message: { type: 'string', example: 'You do not have permission to perform this action' },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
      statusCode: { type: 'integer', example: 403 }
    }
  },

  NotFoundError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Resource not found' },
      message: { type: 'string', example: 'The requested resource was not found' },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
      statusCode: { type: 'integer', example: 404 }
    }
  },

  ConflictError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Resource already exists' },
      message: { type: 'string', example: 'A user with this email already exists' },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
      statusCode: { type: 'integer', example: 409 }
    }
  },

  InternalServerError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Internal server error' },
      message: { type: 'string', example: 'An unexpected error occurred' },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
      statusCode: { type: 'integer', example: 500 }
    }
  }
};

export const swaggerExamples = {
  registerSuccess: {
    summary: 'Successful registration',
    value: {
      success: true,
      data: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john.doe@example.com',
          username: 'johndoe',
          firstName: 'John',
          lastName: 'Doe',
          role: 'DEVELOPER',
          isActive: true,
          isEmailVerified: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z'
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 86400,
          tokenType: 'Bearer'
        }
      },
      message: 'User registered successfully',
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/api/auth/register',
      statusCode: 201
    }
  },

  loginSuccess: {
    summary: 'Successful login',
    value: {
      success: true,
      data: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john.doe@example.com',
          username: 'johndoe',
          firstName: 'John',
          lastName: 'Doe',
          role: 'DEVELOPER',
          isActive: true,
          lastLoginAt: '2024-01-15T10:30:00.000Z'
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 86400,
          tokenType: 'Bearer'
        }
      },
      message: 'Login successful',
      timestamp: '2024-01-15T10:30:00.000Z',
      path: '/api/auth/login',
      statusCode: 200
    }
  }
};
