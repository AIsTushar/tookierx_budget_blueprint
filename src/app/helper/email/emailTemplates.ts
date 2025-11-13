export const otpEmailTemplate = (
  name: string,
  otp: number,
  companyName: string
): string => {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background-color: #ffffff; border: 1px solid #e0e0e0;">
    <div style="text-align: center; margin-bottom: 25px;"></div>
    <h2 style="color: #2c3e50; margin-bottom: 10px; text-align: center;">🔐 One-Time Password (OTP)</h2>
    <p style="font-size: 16px; color: #555;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 16px; color: #555;">Your one-time password (OTP) for verification is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="display: inline-block; font-size: 28px; font-weight: bold; color: #2c3e50; padding: 15px 30px; border: 2px dashed #3498db; border-radius: 10px; background-color: #ecf5fc; letter-spacing: 3px;">
        ${otp}
      </span>
    </div>
    <p style="font-size: 16px; color: #555;">Please enter this code within <strong>5 minutes</strong> to complete your verification.</p>
    <p style="font-size: 15px; color: #888; font-style: italic;">If you didn’t request this code, you can safely ignore this message.</p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    <p style="font-size: 16px; color: #555;">Best regards,</p>
    <p style="font-size: 16px; color: #3498db; font-weight: bold;">${companyName} Team</p>
    <p style="font-size: 13px; color: #999; margin-top: 40px; text-align: center; line-height: 1.5;">
      This is an automated message from <strong>${companyName}</strong>. Please do not reply to this email.
    </p>
  </div>
  `;
};

export const generateAccountLinkEmail = (name: string, url: string) => `
<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333; border: 1px solid #ddd; border-radius: 10px;">
  <h2 style="color: #007bff; text-align: center;">Complete Your Onboarding</h2>

  <p>Dear <b>${name}</b>,</p>

  <p>We’re excited to have you onboard! To get started, please complete your onboarding process by clicking the link below:</p>

  <div style="text-align: center; margin: 20px 0;">
    <a href="${url}" style="background-color: #007bff; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
      Complete Onboarding
    </a>
  </div>

  <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
    ${url}
  </p>

  <p><b>Note:</b> This link is valid for a limited time. Please complete your onboarding as soon as possible.</p>

  <p>Thank you,</p>
  <p><b>The Support Team</b></p>

  <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
  <p style="font-size: 12px; color: #777; text-align: center;">
    If you didn’t request this, please ignore this email or contact support.
  </p>
</div>
`;

export const contactAdminEmailTemplate = (
  name: string,
  email: string,
  subject: string,
  message: string,
  companyName: string
): string => {
  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: auto; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background-color: #ffffff; border: 1px solid #e0e0e0;">
    <h2 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">📩 New Message from Contact Form</h2>

    <p style="font-size: 16px; color: #555;">
      Hello <strong>Admin</strong>,
    </p>

    <p style="font-size: 16px; color: #555;">You have received a new message from the website contact form. Below are the details:</p>

    <div style="background-color: #f9f9f9; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0; font-size: 15px; color: #333;"><strong>Name:</strong> ${name}</p>
      <p style="margin: 5px 0; font-size: 15px; color: #333;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 5px 0; font-size: 15px; color: #333;"><strong>Subject:</strong> ${subject}</p>
      <p style="margin-top: 15px; font-size: 15px; color: #333;"><strong>Message:</strong></p>
      <p style="background-color: #fff; border-left: 4px solid #3498db; padding: 12px 15px; border-radius: 5px; margin-top: 5px; color: #555; line-height: 1.6;">
        ${message}
      </p>
    </div>

    <p style="font-size: 15px; color: #555;">Please respond to this message at your earliest convenience.</p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

    <p style="font-size: 15px; color: #555;">Best regards,</p>
    <p style="font-size: 15px; color: #3498db; font-weight: bold;">${name} System</p>

    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center; line-height: 1.5;">
      This is an automated notification from <strong>${companyName}</strong>. Please do not reply directly to this email.
    </p>
  </div>
  `;
};
