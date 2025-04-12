import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../storage";
import { isAuthenticated } from "./middleware";
import { upload, getAvatarUrl, deleteAvatar } from "./uploads";
import { sendPasswordResetEmail } from "./email";
import { 
  insertUserSchema, 
  loginSchema, 
  resetPasswordRequestSchema, 
  resetPasswordSchema, 
  updateUserSchema,
  updatePasswordSchema
} from "@shared/schema";

const router = express.Router();

// Register a new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Login user
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const loginData = loginSchema.parse(req.body);
    
    console.log(`Login attempt for email: ${loginData.email}`);
    
    passport.authenticate("local", (err: any, user: Express.User, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log(`Authentication failed for ${loginData.email}: ${info.message}`);
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return next(err);
        }
        
        console.log(`User authenticated successfully: ${(user as any).email} (ID: ${(user as any).id})`);
        console.log(`Session ID: ${req.sessionID}`);
        
        // Save the session immediately to ensure it's stored
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
          }
          
          // Return user information
          const { password, ...userWithoutPassword } = user as any;
          return res.json({
            message: "Login successful",
            user: userWithoutPassword,
          });
        });
      });
    })(req, res, next);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    console.error("Login route error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/me", (req: Request, res: Response) => {
  console.log(`/me: Session ID: ${req.sessionID}, Is authenticated: ${req.isAuthenticated()}`);
  
  if (req.session && req.session.passport) {
    console.log(`/me: Session passport data: ${JSON.stringify(req.session.passport)}`);
  }
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Return authenticated user (passport adds user to request)
  const { password, ...userWithoutPassword } = req.user as any;
  res.json(userWithoutPassword);
});

// Logout user
router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  // If user is not logged in, just return success
  if (!req.isAuthenticated()) {
    return res.json({ message: "Logout successful" });
  }
  
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return next(err);
    }
    
    // Clear the session from database as well
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return next(err);
      }
      
      // Clear the cookie by sending an expired one
      res.clearCookie('phish.sid', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: false
      });
      
      res.json({ message: "Logout successful" });
    });
  });
});

// Request password reset
router.post("/reset-password/request", async (req: Request, res: Response) => {
  try {
    // Validate request
    const { email } = resetPasswordRequestSchema.parse(req.body);
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal that user doesn't exist
      return res.json({ message: "If your email exists in our system, you will receive a password reset link" });
    }
    
    // Generate token
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours to give users plenty of time
    
    // Store token in database
    await storage.createPasswordResetToken({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt,
    });
    
    // Generate reset URL
    // In production, use the actual hostname rather than relying on req.get("host")
    // which might not be correctly set in Replit's environment
    let baseUrl;
    if (process.env.NODE_ENV === 'production') {
      // Use a hard-coded domain if we're in production
      // This should be your app's actual domain when deployed on Replit
      const replitDomain = process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : req.get("host");
      baseUrl = `https://${replitDomain}`;
    } else {
      // In development, use the request's protocol and host
      baseUrl = `${req.protocol}://${req.get("host")}`;
    }
    
    console.log(`Generating password reset URL with token: ${resetToken}`);
    // Ensure token is properly passed in the URL
    // Use the format that matches what our frontend is expecting
    // The frontend can handle both routes with parameters and query params
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    console.log(`Reset URL: ${resetUrl}`);
    
    // Send email
    try {
      await sendPasswordResetEmail(email, resetUrl);
      console.log(`Password reset email sent to: ${email}`);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Continue processing even if email fails
    }
    
    res.json({ message: "If your email exists in our system, you will receive a password reset link" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password with token
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    // Validate request
    const { token, password } = resetPasswordSchema.parse(req.body);
    
    console.log(`Password reset request with token: ${token}`);
    
    // Find token in database
    const resetToken = await storage.getPasswordResetToken(token);
    
    if (!resetToken) {
      console.log(`Token not found in database: ${token}`);
      return res.status(400).json({ message: "Invalid token" });
    }
    
    console.log(`Token found: ${resetToken.token}, expires at: ${resetToken.expires_at}, used: ${resetToken.used}`);
    
    // Check if token is already used
    if (resetToken.used) {
      console.log(`Token has already been used: ${token}`);
      return res.status(400).json({ message: "Token has already been used" });
    }
    
    // Check if token is expired
    const now = new Date();
    const expirationDate = new Date(resetToken.expires_at);
    if (now > expirationDate) {
      console.log(`Token has expired at ${expirationDate} (now: ${now})`);
      return res.status(400).json({ message: "Token has expired" });
    }
    
    // Find user
    const user = await storage.getUser(resetToken.user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user password
    await storage.updatePassword(user.id, hashedPassword);
    
    // Mark token as used
    await storage.markTokenAsUsed(resetToken.id);
    
    res.json({ message: "Password has been reset successfully" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    
    // Validate request body
    const profileData = updateUserSchema.parse(req.body);
    
    // Update user in database
    const updatedUser = await storage.updateUser(userId, profileData);
    
    // Return updated user without password
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put("/change-password", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    
    // Validate request body
    const { password } = updatePasswordSchema.parse(req.body);
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password in database
    const updatedUser = await storage.updatePassword(userId, hashedPassword);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Upload avatar
router.post("/avatar", isAuthenticated, upload.single("avatar"), async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Get avatar URL
    const avatarUrl = getAvatarUrl(req.file.filename);
    
    // Get current user
    const user = await storage.getUser(userId);
    
    // Delete old avatar if exists
    if (user?.avatar_path) {
      try {
        await deleteAvatar(user.avatar_path);
      } catch (deleteError) {
        console.error("Failed to delete old avatar:", deleteError);
        // Continue even if deletion fails
      }
    }
    
    // Update user with new avatar path
    const updatedUser = await storage.updateUser(userId, { avatar_path: avatarUrl });
    
    // Return updated user without password
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;