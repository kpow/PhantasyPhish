import nodemailer from "nodemailer";

// SMTP transporter instance
let transporter: nodemailer.Transporter | null = null;

/**
 * Setup the email transporter with Gmail credentials
 * @param gmailUser Gmail address
 * @param gmailPassword Gmail app password
 */
export async function setupEmailTransporter(gmailUser: string, gmailPassword: string) {
  if (!gmailUser || !gmailPassword) {
    console.warn("WARNING: Gmail credentials not provided. Password reset emails will not be sent.");
    return null;
  }

  // Create a test account if credentials not provided (for development)
  if (process.env.NODE_ENV === "development" && (!gmailUser || !gmailPassword)) {
    console.log("Creating test email account for development...");
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log("Using ethereal email for testing: ", testAccount.user);
    return transporter;
  }

  // Create real Gmail transporter
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });
  
  return transporter;
}

/**
 * Send password reset email
 * @param to Recipient email
 * @param resetUrl Password reset URL
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!transporter) {
    console.warn("Email transporter not set up. Cannot send password reset email.");
    return;
  }

  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Phish Setlist Predictor" <no-reply@phishsetlist.com>',
    to: to,
    subject: "Reset Your Password - Phish Setlist Predictor",
    text: `
      Hello,
      
      You requested to reset your password for your Phish Setlist Predictor account.
      
      Please click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
      
      Thank you,
      Phish Setlist Predictor Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2D3748;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for your Phish Setlist Predictor account.</p>
        <p>Please click the button below to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #4299E1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>Thank you,<br>Phish Setlist Predictor Team</p>
      </div>
    `,
  });

  // Log email info for development
  if (process.env.NODE_ENV === "development") {
    console.log("Email sent: %s", info.messageId);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  }
  
  return info;
}

/**
 * Send email verification email
 * @param to Recipient email
 * @param verificationUrl Email verification URL
 */
export async function sendEmailVerificationEmail(to: string, verificationUrl: string) {
  if (!transporter) {
    console.warn("Email transporter not set up. Cannot send email verification.");
    return;
  }

  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Phish Setlist Predictor" <no-reply@phishsetlist.com>',
    to: to,
    subject: "Verify Your Email - Phish Setlist Predictor",
    text: `
      Hello,
      
      Thank you for registering with Phish Setlist Predictor!
      
      Please click the link below to verify your email address:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with us, you can safely ignore this email.
      
      Thank you,
      Phish Setlist Predictor Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2D3748;">Verify Your Email</h2>
        <p>Hello,</p>
        <p>Thank you for registering with Phish Setlist Predictor!</p>
        <p>Please click the button below to verify your email address:</p>
        <p style="text-align: center;">
          <a href="${verificationUrl}" style="display: inline-block; background-color: #4299E1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with us, you can safely ignore this email.</p>
        <p>Thank you,<br>Phish Setlist Predictor Team</p>
      </div>
    `,
  });

  // Log email info for development
  if (process.env.NODE_ENV === "development") {
    console.log("Email sent: %s", info.messageId);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  }
  
  return info;
}