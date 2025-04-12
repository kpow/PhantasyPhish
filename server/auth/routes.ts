import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "../storage";
import { 
  loginSchema, 
  resetPasswordRequestSchema, 
  resetPasswordSchema, 
  insertUserSchema,
  updateUserSchema,
  updatePasswordSchema
} from "@shared/schema";
import { isAuthenticated, handleAuthErrors } from "./middleware";
import { upload, getAvatarUrl, deleteAvatar } from "./uploads";
import { sendPasswordResetEmail } from "./email";

const router = Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user with this email already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create the user with hashed password
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error registering user:", error);
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    loginSchema.parse(req.body);
    
    passport.authenticate("local", (err: Error | null, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || "Invalid credentials" });
      }
      
      req.logIn(user, (loginErr: Error | null) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        return res.json({
          message: "Login successful",
          user: userWithoutPassword
        });
      });
    })(req, res, next);
  } catch (error: any) {
    console.error("Error logging in:", error);
    res.status(400).json({ message: error.message });
  }
}, handleAuthErrors);

// Get current user
router.get("/me", isAuthenticated, (req: Request, res: Response) => {
  // Remove password from response
  const { password, ...userWithoutPassword } = req.user as any;
  
  res.json(userWithoutPassword);
});

// Logout
router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err: Error | null) => {
    if (err) {
      return next(err);
    }
    res.json({ message: "Logout successful" });
  });
});

// Request password reset
router.post("/reset-password/request", async (req: Request, res: Response) => {
  try {
    const { email } = resetPasswordRequestSchema.parse(req.body);
    
    // Find user with this email
    const user = await storage.getUserByEmail(email);
    
    // If user exists, generate reset token
    if (user) {
      // Generate random token
      const token = crypto.randomBytes(32).toString("hex");
      
      // Set token expiration (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Save token to database
      await storage.createPasswordResetToken({
        user_id: user.id,
        token,
        expires_at: expiresAt
      });
      
      // Create reset URL
      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${token}`;
      
      // Send email
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
        res.json({ message: "Password reset email sent" });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        res.status(500).json({ 
          message: "Failed to send reset email. Please try again later.",
          debug: process.env.NODE_ENV === "development" ? emailError : undefined
        });
      }
    } else {
      // Don't reveal that email doesn't exist for security reasons
      res.json({ message: "If an account with that email exists, a password reset link has been sent" });
    }
  } catch (error: any) {
    console.error("Error requesting password reset:", error);
    res.status(400).json({ message: error.message });
  }
});

// Reset password with token
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    
    // Find valid token
    const resetToken = await storage.getPasswordResetToken(token);
    
    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the user's password
    await storage.updatePassword(resetToken.user_id, hashedPassword);
    
    // Mark token as used
    await storage.markTokenAsUsed(resetToken.id);
    
    res.json({ message: "Password reset successful" });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update user profile
router.put("/profile", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const updateData = updateUserSchema.parse(req.body);
    
    const updatedUser = await storage.updateUser(userId, updateData);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error updating profile:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update password (authenticated)
router.put("/change-password", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { password } = updatePasswordSchema.parse(req.body);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the password
    await storage.updatePassword(userId, hashedPassword);
    
    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Error changing password:", error);
    res.status(400).json({ message: error.message });
  }
});

// Upload avatar
router.post("/avatar", isAuthenticated, upload.single("avatar"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // If user already has an avatar, delete the old one
    if (user.avatar_path) {
      try {
        await deleteAvatar(user.avatar_path);
      } catch (error) {
        console.error("Failed to delete old avatar:", error);
      }
    }
    
    // Update user with new avatar path
    const avatarUrl = getAvatarUrl(req.file.filename);
    const updatedUser = await storage.updateUser(userId, { avatar_path: avatarUrl });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({ message: "Avatar uploaded successfully", user: userWithoutPassword });
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    res.status(400).json({ message: error.message });
  }
});

export default router;