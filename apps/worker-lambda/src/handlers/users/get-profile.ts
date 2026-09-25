import { HttpStatus } from '@repo/shared';
import { UnauthorizedError } from '../../core/errors.js';
import { formatSuccessResponse } from '../../core/response.js';
import { withMiddleware } from '../../middleware/with-middleware.js';
import { usersService } from '../../modules/users/users.service.js';

export const handler = withMiddleware(async (req) => {
  if (!req.user) {
    throw new UnauthorizedError('Vui lòng đăng nhập để truy cập thông tin cá nhân');
  }

  const profile = await usersService.getUserProfile(req.user.id);

  return formatSuccessResponse(profile, HttpStatus.OK, 'Lấy thông tin cá nhân thành công');
});
