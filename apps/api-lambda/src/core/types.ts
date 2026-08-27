import type { UserRoleType } from '@repo/shared';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context as AWSLambdaContext,
} from 'aws-lambda';

export type LambdaEvent = APIGatewayProxyEventV2;
export type LambdaResult = APIGatewayProxyStructuredResultV2;
export type LambdaContext = AWSLambdaContext;

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRoleType;
  fullName: string;
}

export interface RequestContext {
  event: LambdaEvent;
  context: LambdaContext;
  user?: AuthenticatedUser;
  body?: unknown;
  query?: Record<string, string | undefined>;
}
