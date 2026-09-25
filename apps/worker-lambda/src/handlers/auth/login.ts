import { HttpStatus, loginSchema } from '@repo/shared';
import { formatSuccessResponse } from '../../core/response.js';
import { withMiddleware } from '../../middleware/with-middleware.js';
import { validateBody } from '../../middleware/with-validator.js';
import { authService } from '../../modules/auth/auth.service.js';

export const handler = withMiddleware(async (req) => {
  // Validate request body using shared Zod schema
  const input = validateBody(loginSchema, req.body);

  const result = await authService.login(input);

  return formatSuccessResponse(result, HttpStatus.OK, 'Đăng nhập thành công');
});
