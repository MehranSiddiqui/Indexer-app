export const generatePasswordUpdateSuccessEmail = (
  name: string,
  loginLink: string,
): string => {
  return `
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.5;">
      <p>Hi ${name},</p>
      
      <p>Your password has been successfully updated.</p>
      
      <p>You can now log in to your account using your new password by clicking the button below:</p>
      
      <!-- Clickable Button -->
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 6px;" bgcolor="#007bff">
                  <a href="${loginLink}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 14px 28px; border: 1px solid #007bff; display: inline-block; font-weight: bold;">
                    Log In to Your Account
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <!-- Fallback Copy-Paste Link -->
      <p style="margin-top: 20px;">
        If the button doesn't work, you can copy and paste this link directly into your browser:
      </p>
      <p style="word-break: break-all; margin-top: 10px;">
        <a href="${loginLink}" style="color: #007bff; text-decoration: underline;">
          ${loginLink}
        </a>
      </p>
      
      <!-- Security Notice -->
      <div style="margin-top: 30px; padding: 15px; background-color: #fff3f3; border-left: 4px solid #d9534f; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #d9534f; font-weight: bold;">
          Security Notice:
        </p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #555555;">
          If you did not make this change, please contact our support team immediately to secure your account.
        </p>
      </div>
    </div>
  `;
};
