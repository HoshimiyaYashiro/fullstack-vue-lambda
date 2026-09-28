import { CreateApiCommand, CreateStageCommand, GetApisCommand } from '@aws-sdk/client-apigatewayv2';
import { apiGateway } from './clients.js';
import { createIfMissing } from './errors.js';

export async function seedApiGateway() {
  console.log('[API Gateway] Creating HTTP API and default stage...');
  const apis = await apiGateway.send(new GetApisCommand({}));
  let apiId = apis.Items?.find((api) => api.Name === 'enterprise-http-api')?.ApiId;
  if (!apiId) {
    const created = await apiGateway.send(
      new CreateApiCommand({
        Name: 'enterprise-http-api',
        ProtocolType: 'HTTP',
        CorsConfiguration: {
          AllowOrigins: ['http://localhost:3000', 'http://localhost:3001'],
          AllowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          AllowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
          AllowCredentials: true,
          MaxAge: 300,
        },
      })
    );
    apiId = created.ApiId;
  }
  if (!apiId) throw new Error('API Gateway did not return an API ID.');

  await createIfMissing(
    () =>
      apiGateway.send(
        new CreateStageCommand({ ApiId: apiId, StageName: '$default', AutoDeploy: true })
      ),
    'API Gateway $default stage'
  );
}
