import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import type { User } from "@shared/schema";

// Configure Passport.js local strategy
export function configurePassport() {
  // Use local strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          // Find user by email
          const user = await storage.getUserByEmail(email);
          
          // If user not found or password doesn't match
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // Compare password with hashed password in database
          const isMatch = await bcrypt.compare(password, user.password);
          
          if (!isMatch) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // Authentication successful
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  
  // Serialize user to store in session
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

export default passport;