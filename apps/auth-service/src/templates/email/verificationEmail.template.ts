export const generateVerificationEmailTemplate = (
  link: string,
  name: string,
): string => {
  return `
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.5;">
      <p>Hi ${name},</p>
      
      <p>Welcome! Please verify your email address by clicking the button below:</p>
      
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 6px;" bgcolor="#007bff">
                  <a href="${link}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 14px 28px; border: 1px solid #007bff; display: inline-block; font-weight: bold;">
                    Verify Email
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <p style="margin-top: 20px;">
        If the button doesn't work, you can copy and paste this link directly into your browser:
      </p>
      <p style="word-break: break-all; margin-top: 10px;">
        <a href="${link}" style="color: #007bff; text-decoration: underline;">
          ${link}
        </a>
      </p>
      
      <p style="margin-top: 30px; font-size: 14px; color: #888888;">
        If you did not request this email, you can safely ignore it.
      </p>
    </div>
  `;
};
