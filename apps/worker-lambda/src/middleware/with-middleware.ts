import { HttpStatus } from '@repo/shared';
import { AppError } from '../core/errors.js';
import { formatErrorResponse } from '../core/response.js';
import type {
  AuthenticatedUser,
  LambdaContext,
  LambdaEvent,
  LambdaResult,
  RequestContext,
} from '../core/types.js';

export type HandlerFn = (req: RequestContext) => Promise<LambdaResult>;

export function withMiddleware(handler: HandlerFn) {
  return async (event: LambdaEvent, context: LambdaContext): Promise<LambdaResult> => {
    // 1. Handle CORS preflight
    if (event.requestContext?.http?.method === 'OPTIONS') {
      return {
        statusCode: HttpStatus.NO_CONTENT,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        },
      };
    }

    try {
      // 2. Parse body safely
      let parsedBody: unknown;
      if (event.body) {
        try {
          const raw = event.isBase64Encoded
            ? Buffer.from(event.body, 'base64').toString('utf-8')
            : event.body;
          parsedBody = JSON.parse(raw);
        } catch {
          // Keep raw or undefined if not JSON
          parsedBody = event.body;
        }
      }

      // 3. Extract Auth User if Bearer token present
      let user: AuthenticatedUser | undefined;
      const authHeader = event.headers?.authorization || event.headers?.Authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          // Supports standard JWT (header.payload.signature) or raw base64
          const parts = token.split('.');
          const payloadBase64 = parts.length >= 2 ? (parts[1] ?? '') : token;
          const normalizedBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(Buffer.from(normalizedBase64, 'base64').toString('utf-8'));

          const groups: string[] = decoded['cognito:groups'] || decoded.groups || [];
          const isAdmin =
            groups.includes('Operator') ||
            groups.includes('TenantAdmin') ||
            decoded.role === 'admin';

          user = {
            id: decoded.sub || decoded.id || 'usr_1',
            email: decoded.email || 'user@example.com',
            role: isAdmin ? 'admin' : decoded.role || 'user',
            fullName: decoded.name || decoded.fullName || decoded.email || 'Enterprise User',
            tenantId: decoded['custom:tenant_id'] || decoded.tenantId,
            groups,
          };
        } catch {
          // If plain mock token string
          user = {
            id: 'usr_default',
            email: 'user@enterprise.internal',
            role: token.includes('admin') ? 'admin' : 'user',
            fullName: token.includes('admin') ? 'System Administrator' : 'Enterprise User',
          };
        }
      }

      const requestContext: RequestContext = {
        event,
        context,
        user,
        body: parsedBody,
        query: event.queryStringParameters || {},
      };

      return await handler(requestContext);
    } catch (err: unknown) {
      console.error('[LambdaExecutionError]', err);

      if (err instanceof AppError) {
        return formatErrorResponse(
          {
            code: err.code,
            message: err.message,
            details: err.details,
          },
          err.statusCode
        );
      }

      const fallbackMessage = err instanceof Error ? err.message : 'Internal Server Error';
      return formatErrorResponse(
        {
          message: fallbackMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };
}
