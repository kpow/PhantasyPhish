import { eq } from 'drizzle-orm';
import { db } from './database';
import { IStorage } from './storage';
import { 
  users, 
  songs, 
  shows, 
  predictions, 
  password_reset_tokens,
  email_verification_tokens,
  type User, 
  type InsertUser,
  type UpdateUser,
  type Song, 
  type InsertSong, 
  type Show, 
  type InsertShow, 
  type Prediction, 
  type InsertPrediction,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type EmailVerificationToken,
  type InsertEmailVerificationToken
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User> {
    const result = await db
      .update(users)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return result[0];
  }

  async updatePassword(id: number, hashedPassword: string): Promise<User> {
    const result = await db
      .update(users)
      .set({
        password: hashedPassword,
        updated_at: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return result[0];
  }
  
  async verifyUserEmail(id: number): Promise<User> {
    const result = await db
      .update(users)
      .set({
        email_verified: true,
        updated_at: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return result[0];
  }

  // Password reset operations
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const result = await db.insert(password_reset_tokens).values(token).returning();
    return result[0];
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const result = await db
      .select()
      .from(password_reset_tokens)
      .where(eq(password_reset_tokens.token, token));
    return result[0];
  }

  async markTokenAsUsed(tokenId: number): Promise<PasswordResetToken> {
    const result = await db
      .update(password_reset_tokens)
      .set({ used: true })
      .where(eq(password_reset_tokens.id, tokenId))
      .returning();
    
    if (!result[0]) {
      throw new Error(`Token with id ${tokenId} not found`);
    }
    
    return result[0];
  }
  
  // Email verification operations
  async createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    const result = await db.insert(email_verification_tokens).values(token).returning();
    return result[0];
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const result = await db
      .select()
      .from(email_verification_tokens)
      .where(eq(email_verification_tokens.token, token));
    return result[0];
  }

  async markEmailVerificationTokenAsUsed(tokenId: number): Promise<EmailVerificationToken> {
    const result = await db
      .update(email_verification_tokens)
      .set({ used: true })
      .where(eq(email_verification_tokens.id, tokenId))
      .returning();
    
    if (!result[0]) {
      throw new Error(`Email verification token with id ${tokenId} not found`);
    }
    
    return result[0];
  }

  // Song operations
  async getAllSongs(): Promise<Song[]> {
    return db.select().from(songs);
  }

  async getSong(id: number): Promise<Song | undefined> {
    const result = await db.select().from(songs).where(eq(songs.id, id));
    return result[0];
  }

  async getSongByName(name: string): Promise<Song | undefined> {
    const result = await db.select().from(songs).where(eq(songs.name, name));
    return result[0];
  }

  async createSong(song: InsertSong): Promise<Song> {
    const result = await db.insert(songs).values(song).returning();
    return result[0];
  }

  // Show operations
  async getAllShows(): Promise<Show[]> {
    return db.select().from(shows);
  }

  async getShow(id: number): Promise<Show | undefined> {
    const result = await db.select().from(shows).where(eq(shows.id, id));
    return result[0];
  }

  async getShowByShowId(showId: string): Promise<Show | undefined> {
    const result = await db.select().from(shows).where(eq(shows.show_id, showId));
    return result[0];
  }

  async createShow(show: InsertShow): Promise<Show> {
    const result = await db.insert(shows).values(show).returning();
    return result[0];
  }

  // Prediction operations
  async getAllPredictions(): Promise<Prediction[]> {
    return db.select().from(predictions);
  }

  async getPrediction(id: number): Promise<Prediction | undefined> {
    const result = await db.select().from(predictions).where(eq(predictions.id, id));
    return result[0];
  }

  async getUserPredictions(userId: number): Promise<Prediction[]> {
    return db.select().from(predictions).where(eq(predictions.user_id, userId));
  }

  async getShowPredictions(showId: string): Promise<Prediction[]> {
    return db.select().from(predictions).where(eq(predictions.show_id, showId));
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const result = await db.insert(predictions).values(prediction).returning();
    return result[0];
  }

  async updatePredictionScore(id: number, score: number): Promise<Prediction> {
    const result = await db
      .update(predictions)
      .set({ score })
      .where(eq(predictions.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error(`Prediction with id ${id} not found`);
    }
    
    return result[0];
  }

  async deletePredictionByUserAndShow(userId: number, showId: string): Promise<boolean> {
    const result = await db
      .delete(predictions)
      .where(
        and(
          eq(predictions.user_id, userId),
          eq(predictions.show_id, showId)
        )
      )
      .returning();
    
    // Return true if any rows were deleted
    return result.length > 0;
  }
}