import { HttpStatus, UserRole } from '@repo/shared';
import { ForbiddenError, UnauthorizedError } from '../../core/errors.js';
import { formatSuccessResponse } from '../../core/response.js';
import { withMiddleware } from '../../middleware/with-middleware.js';
import { adminService } from '../../modules/admin/admin.service.js';

export const handler = withMiddleware(async (req) => {
  if (!req.user) {
    throw new UnauthorizedError('Yêu cầu xác thực tài khoản quản trị');
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new ForbiddenError('Chỉ Quản trị viên cấp cao mới có quyền xem thông số hệ thống');
  }

  const metrics = await adminService.getMetrics();

  return formatSuccessResponse(metrics, HttpStatus.OK, 'Lấy thông số hệ thống thành công');
});
