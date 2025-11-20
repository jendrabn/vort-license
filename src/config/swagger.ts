const swaggerSpec = {
  openapi: '3.0.1',
  info: {
    title: 'Vort License API',
    version: '1.0.0',
    description: 'License authentication endpoints and operational details.'
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3000',
      description: 'Default server'
    }
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Token issuance and logout'
    }
  ],
  components: {
    schemas: {
      IssueTokenRequest: {
        type: 'object',
        required: ['license', 'bot_userid', 'hwid'],
        properties: {
          license: { type: 'string', description: 'License key' },
          bot_userid: { type: 'string', description: 'User identifier' },
          hwid: { type: 'string', description: 'Hardware/device identifier' }
        },
        example: {
          license: 'GROW-ABCD-1234-Z9',
          bot_userid: 'user-123',
          hwid: 'device-xyz'
        }
      },
      LogoutRequest: {
        type: 'object',
        required: ['license', 'bot_userid', 'hwid'],
        properties: {
          license: { type: 'string', description: 'License key' },
          bot_userid: { type: 'string', description: 'User identifier' },
          hwid: { type: 'string', description: 'Hardware/device identifier' }
        },
        example: {
          license: 'GROW-ABCD-1234-Z9',
          bot_userid: 'user-123',
          hwid: 'device-xyz'
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'License expired.' }
        }
      },
      LogoutResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Logout successful.' }
        }
      }
    }
  },
  paths: {
    '/api/auth/token': {
      post: {
        tags: ['Auth'],
        summary: 'Issue encrypted token for a valid license',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/IssueTokenRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Encrypted response payload as hex string, or error object when validation fails',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { type: 'string', description: 'Encrypted hex string representing the success payload' },
                    { $ref: '#/components/schemas/ErrorResponse' }
                  ]
                },
                examples: {
                  success: {
                    summary: 'Encrypted payload',
                    value: '9F2A3B4C5D6E7F80818283'
                  },
                  error: {
                    summary: 'Error message',
                    value: {
                      status: 'error',
                      message: 'License expired.'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout and clear active session binding',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LogoutRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Logout result',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/LogoutResponse' },
                    { $ref: '#/components/schemas/ErrorResponse' }
                  ]
                },
                examples: {
                  success: {
                    summary: 'Logout success',
                    value: {
                      status: 'success',
                      message: 'Logout successful.'
                    }
                  },
                  error: {
                    summary: 'Error message',
                    value: {
                      status: 'error',
                      message: 'License not found.'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export default swaggerSpec;
