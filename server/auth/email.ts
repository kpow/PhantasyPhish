import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
let transporter: nodemailer.Transporter;

export async function setupEmailTransporter(gmailUser: string, gmailPassword: string) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!transporter) {
    throw new Error("Email transporter not configured. Please set up GMAIL credentials.");
  }
  
  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: `"Phish Setlist Predictor" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset Your Password",
    text: `
      Hello,
      
      You requested to reset your password. Please click the link below to set a new password:
      
      ${resetUrl}
      
      This link will expire in 1 hour. If you did not request this, please ignore this email.
      
      Thanks,
      The Phish Setlist Predictor Team
    `,
  });
  
  return info;
}