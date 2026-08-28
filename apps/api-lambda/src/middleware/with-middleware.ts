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

      // 3. Extract Mock Auth User if Bearer token present
      let user: AuthenticatedUser | undefined;
      const authHeader = event.headers?.authorization || event.headers?.Authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          // Decodes simple base64 token or mock token payload for demonstration
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
          user = {
            id: decoded.id || 'usr_1',
            email: decoded.email || 'user@example.com',
            role: decoded.role || 'user',
            fullName: decoded.fullName || 'Enterprise User',
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
