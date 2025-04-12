import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { User } from "@shared/schema";

// Configure passport to use local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Find user with the given email
        const user = await storage.getUserByEmail(email);
        
        // If user not found or password is incorrect
        if (!user || !await bcrypt.compare(password, user.password)) {
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

// Serialize user to the session
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    
    if (!user) {
      return done(new Error("User not found"));
    }
    
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;