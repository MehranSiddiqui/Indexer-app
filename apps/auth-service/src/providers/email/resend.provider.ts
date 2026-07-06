import { EmailProvider, SendEmailOptions } from "./email.provider.js";
import { Resend } from "resend";
import { env } from "../../config/env.js";
class ResendProvider implements EmailProvider {
  private readonly resend = new Resend(env.RESEND_API_KEY);
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const response = await this.resend.emails.send({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(response)
    } catch (error) {
      console.error(error);
      throw new Error("Failed to send email due to server issue!");
    }
  }
}
const resendProvider = new ResendProvider();

export default resendProvider;
