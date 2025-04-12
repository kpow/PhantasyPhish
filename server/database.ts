import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { 
  users, 
  songs, 
  shows, 
  predictions, 
  password_reset_tokens
} from "@shared/schema";

const { Pool } = pg;

// Create a connection pool to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle with the connection pool
export const db = drizzle(pool);

// Run migrations on startup
export async function runMigrations() {
  try {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');
    
    // Verify all required tables exist after migration
    const tables = ['users', 'password_reset_tokens', 'songs', 'shows', 'predictions', 'session'];
    for (const table of tables) {
      const result = await db.execute(sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${table}
      )`);
      
      const exists = result.rows[0]?.exists === true;
      if (!exists) {
        console.warn(`Table '${table}' does not exist, may need to be created manually`);
      } else {
        console.log(`Table '${table}' exists`);
      }
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}