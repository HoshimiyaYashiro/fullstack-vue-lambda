import { HttpStatus } from '@repo/shared';
import { formatSuccessResponse } from '../core/response.js';
import { withMiddleware } from '../middleware/with-middleware.js';

export const handler = withMiddleware(async () => {
  return formatSuccessResponse(
    {
      status: 'UP',
      service: 'api-lambda',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
    HttpStatus.OK,
    'Hệ thống hoạt động bình thường'
  );
});
