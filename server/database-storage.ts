import { eq } from 'drizzle-orm';
import { and, desc } from 'drizzle-orm/expressions';
import { db } from './database';
import { IStorage } from './storage';
import { 
  users, 
  songs, 
  shows,
  tours, 
  predictions, 
  password_reset_tokens,
  email_verification_tokens,
  type User, 
  type InsertUser,
  type UpdateUser,
  type Song, 
  type InsertSong,
  type Tour,
  type InsertTour, 
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
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.id));
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

  // Tour operations
  async getAllTours(): Promise<Tour[]> {
    return db.select().from(tours);
  }

  async getTour(id: number): Promise<Tour | undefined> {
    const result = await db.select().from(tours).where(eq(tours.id, id));
    return result[0];
  }

  async getTourByName(name: string): Promise<Tour | undefined> {
    const result = await db.select().from(tours).where(eq(tours.name, name));
    return result[0];
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const result = await db.insert(tours).values(tour).returning();
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

  async getShowsByTour(tourId: number): Promise<Show[]> {
    return db.select().from(shows).where(eq(shows.tour_id, tourId));
  }

  async createShow(show: InsertShow): Promise<Show> {
    const result = await db.insert(shows).values(show).returning();
    return result[0];
  }
  
  async updateShowScoredStatus(showId: string, isScored: boolean): Promise<Show | undefined> {
    const result = await db
      .update(shows)
      .set({ is_scored: isScored })
      .where(eq(shows.show_id, showId))
      .returning();
    
    return result[0];
  }
  
  async updateShowTour(showId: string, tourId: number): Promise<Show | undefined> {
    const result = await db
      .update(shows)
      .set({ tour_id: tourId })
      .where(eq(shows.show_id, showId))
      .returning();
    
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
    console.log(`Attempting to delete prediction for user ${userId} and show ${showId}`);
    
    try {
      // First find the prediction to make sure we get exact match
      const toDelete = await db
        .select()
        .from(predictions)
        .where(
          and(
            eq(predictions.user_id, userId),
            eq(predictions.show_id, showId)
          )
        );
        
      console.log(`Found predictions to delete:`, toDelete.map(p => ({ id: p.id, show_id: p.show_id })));
        
      const result = await db
        .delete(predictions)
        .where(
          and(
            eq(predictions.user_id, userId),
            eq(predictions.show_id, showId)
          )
        )
        .returning();
      
      console.log(`Delete operation returned ${result.length} rows`);
      
      // Return true if any rows were deleted
      return result.length > 0;
    } catch (error) {
      console.error("Error in deletePredictionByUserAndShow:", error);
      throw error;
    }
  }

  // Leaderboard operations
  async getLeaderboardForShow(showId: string): Promise<{userId: number, userName: string, score: number}[]> {
    // Join predictions with users to get usernames
    const result = await db.execute<{userId: number, userName: string, score: number}>(
      `SELECT p.user_id as "userId", u.display_name as "userName", p.score
       FROM predictions p
       JOIN users u ON p.user_id = u.id
       WHERE p.show_id = $1 AND p.score IS NOT NULL
       ORDER BY p.score DESC`,
      [showId]
    );
    
    return result.rows.map(row => ({
      userId: Number(row.userId),
      userName: String(row.userName || 'Anonymous'),
      score: Number(row.score)
    }));
  }

  async getLeaderboardForTour(tourId: number): Promise<{userId: number, userName: string, totalScore: number, showsParticipated: number}[]> {
    // Get all shows in this tour
    const tourShows = await this.getShowsByTour(tourId);
    const showIds = tourShows.map(show => show.show_id);
    
    if (showIds.length === 0) {
      return [];
    }
    
    // Get aggregate scores by user across all shows in the tour
    const result = await db.execute<{userId: number, userName: string, totalScore: number, showsParticipated: number}>(
      `SELECT 
         p.user_id as "userId", 
         u.display_name as "userName", 
         SUM(p.score) as "totalScore",
         COUNT(p.id) as "showsParticipated"
       FROM predictions p
       JOIN users u ON p.user_id = u.id
       WHERE p.show_id = ANY($1) AND p.score IS NOT NULL
       GROUP BY p.user_id, u.display_name
       ORDER BY "totalScore" DESC`,
      [showIds]
    );
    
    return result.rows.map(row => ({
      userId: Number(row.userId),
      userName: String(row.userName || 'Anonymous'),
      totalScore: Number(row.totalScore || 0),
      showsParticipated: Number(row.showsParticipated || 0)
    }));
  }

  async getUserScoreForTour(userId: number, tourId: number): Promise<{totalScore: number, showsParticipated: number}> {
    // Get all shows in this tour
    const tourShows = await this.getShowsByTour(tourId);
    const showIds = tourShows.map(show => show.show_id);
    
    if (showIds.length === 0) {
      return { totalScore: 0, showsParticipated: 0 };
    }
    
    // Get aggregate score for this user across all tour shows
    const result = await db.execute<{totalScore: string, showsParticipated: string}>(
      `SELECT 
         COALESCE(SUM(p.score), 0) as "totalScore",
         COUNT(p.id) as "showsParticipated"
       FROM predictions p
       WHERE p.user_id = $1 AND p.show_id = ANY($2) AND p.score IS NOT NULL`,
      [userId, showIds]
    );
    
    if (result.rows.length === 0) {
      return { totalScore: 0, showsParticipated: 0 };
    }
    
    return {
      totalScore: Number(result.rows[0].totalScore || 0),
      showsParticipated: Number(result.rows[0].showsParticipated || 0)
    };
  }

  async scoreAllPredictionsForShow(showId: string): Promise<{processed: number, updated: number, errors: number}> {
    // This will be implemented in the routes using the scorePrediction utility
    // since it requires fetching the actual setlist from the API
    return { processed: 0, updated: 0, errors: 0 };
  }
}