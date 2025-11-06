import nodemailer from "nodemailer";

const adminEmail = process.env.MAIL_USER;
const adminPass = process.env.MAIL_PASS;
const companyName = process.env.COMPANY_NAME || "EcomGrove";

if (!adminEmail || !adminPass) {
  throw new Error("Missing MAIL_USER or MAIL_PASS in environment variables.");
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: adminEmail,
    pass: adminPass,
  },
});

//   const transporter = nodemailer.createTransport({
//   host: 'mail.privateemail.com', // your SMTP host
//   port: 465, // or 587
//   secure: true, // true for port 465, false for port 587
//   auth: {
//     user: 'your@email.com',
//     pass: 'your_email_password', // consider using environment variables!
//   },
// });

export const COMPANY_NAME = companyName;
export const ADMIN_EMAIL = adminEmail;
