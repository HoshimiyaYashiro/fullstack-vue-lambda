import {
  CreateTemplateCommand,
  DeleteTemplateCommand,
  VerifyEmailIdentityCommand,
} from '@aws-sdk/client-ses';
import { ses } from './clients.js';
import { isNotFound } from './errors.js';

export async function seedSes() {
  console.log('[SES] Verifying mock identities and creating the OTP template...');
  for (const email of [
    'noreply@enterprise.local',
    'admin@enterprise.local',
    'developer@enterprise.local',
  ]) {
    await ses.send(new VerifyEmailIdentityCommand({ EmailAddress: email }));
  }

  try {
    await ses.send(new DeleteTemplateCommand({ TemplateName: 'OtpVerificationTemplate' }));
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
  await ses.send(
    new CreateTemplateCommand({
      Template: {
        TemplateName: 'OtpVerificationTemplate',
        SubjectPart: 'Your Verification Code: {{otp}}',
        HtmlPart:
          '<h1>Security Verification</h1><p>Your one-time code is: <strong>{{otp}}</strong></p>',
        TextPart: 'Your one-time code is: {{otp}}.',
      },
    })
  );
}
