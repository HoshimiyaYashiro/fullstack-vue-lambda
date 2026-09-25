import { HttpStatus, UserRole, userQuerySchema } from '@repo/shared';
import { ForbiddenError, UnauthorizedError } from '../../core/errors.js';
import { formatSuccessResponse } from '../../core/response.js';
import { withMiddleware } from '../../middleware/with-middleware.js';
import { validateQuery } from '../../middleware/with-validator.js';
import { adminService } from '../../modules/admin/admin.service.js';

export const handler = withMiddleware(async (req) => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu xác thực tài khoản quản trị');
  }

  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.MANAGER) {
    throw new ForbiddenError('Chỉ quản trị viên mới có quyền truy cập danh sách người dùng');
  }

  const query = validateQuery(userQuerySchema, req.query);
  const result = await adminService.listUsers(query);

  return formatSuccessResponse(result, HttpStatus.OK, 'Lấy danh sách người dùng thành công');
});
