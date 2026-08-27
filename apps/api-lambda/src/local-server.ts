import http from 'node:http';
import { URL } from 'node:url';
import type { LambdaContext, LambdaEvent, LambdaResult } from './core/types.js';
import { handler as listUsersHandler } from './handlers/admin/list-users.js';
import { handler as metricsHandler } from './handlers/admin/metrics.js';
import { handler as loginHandler } from './handlers/auth/login.js';
import { handler as healthHandler } from './handlers/health.js';
import { handler as profileHandler } from './handlers/users/get-profile.js';

const PORT = Number(process.env.PORT) || 4000;

// Mapping routes to Lambda handlers for offline local dev
const routes: Array<{
  method: string;
  path: string;
  handler: (event: LambdaEvent, context: LambdaContext) => Promise<LambdaResult>;
}> = [
  { method: 'GET', path: '/health', handler: healthHandler },
  { method: 'POST', path: '/auth/login', handler: loginHandler },
  { method: 'GET', path: '/users/profile', handler: profileHandler },
  { method: 'GET', path: '/admin/users', handler: listUsersHandler },
  { method: 'GET', path: '/admin/metrics', handler: metricsHandler },
];

const dummyContext: LambdaContext = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'local-lambda-runner',
  functionVersion: '1.0.0',
  invokedFunctionArn: 'arn:aws:lambda:local:000000000000:function:local',
  memoryLimitInMB: '256',
  awsRequestId: 'req_local_123',
  logGroupName: '/aws/lambda/local',
  logStreamName: '2025/08/27/local',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase() || 'GET';

  // Read request body
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const bodyString = Buffer.concat(chunks).toString('utf-8');

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    });
    res.end();
    return;
  }

  // Find matching route
  const route = routes.find((r) => r.method === method && r.path === pathname);

  if (!route) {
    res.writeHead(404, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Endpoint ${method} ${pathname} không tồn tại trên Lambda Local Gateway`,
        },
      })
    );
    return;
  }

  // Parse query params
  const queryStringParameters: Record<string, string> = {};
  for (const [key, val] of parsedUrl.searchParams.entries()) {
    queryStringParameters[key] = val;
  }

  // Convert to APIGatewayProxyEventV2
  const event: LambdaEvent = {
    version: '2.0',
    routeKey: `${method} ${pathname}`,
    rawPath: pathname,
    rawQueryString: parsedUrl.search.replace('?', ''),
    headers: req.headers as Record<string, string>,
    queryStringParameters,
    requestContext: {
      accountId: '000000000000',
      apiId: 'local-api',
      domainName: 'localhost',
      domainPrefix: 'localhost',
      http: {
        method,
        path: pathname,
        protocol: 'HTTP/1.1',
        sourceIp: req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'local-client',
      },
      requestId: `req_local_${Date.now()}`,
      routeKey: `${method} ${pathname}`,
      stage: 'dev',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    body: bodyString || undefined,
    isBase64Encoded: false,
  };

  try {
    const result = await route.handler(event, dummyContext);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...(result.headers as Record<string, string>),
    };

    res.writeHead(result.statusCode || 200, headers);
    res.end(result.body || '');
  } catch (err) {
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown Server Error',
        },
      })
    );
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 [AWS Lambda Local Dev Gateway] Running at http://localhost:${PORT}`);
  console.log('Available Endpoints:');
  for (const r of routes) {
    console.log(`  - ${r.method.padEnd(6)} http://localhost:${PORT}${r.path}`);
  }
  console.log('\n');
});
