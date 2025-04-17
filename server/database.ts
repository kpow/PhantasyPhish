import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { 
  users, 
  songs, 
  shows, 
  predictions, 
  password_reset_tokens,
  email_verification_tokens,
  site_config
} from "@shared/schema";

const { Pool } = pg;

// Create a connection pool to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle with the connection pool
export const db = drizzle(pool);

// Check if required tables exist in the database
export async function checkDatabaseTables() {
  try {
    const tables = ['users', 'password_reset_tokens', 'email_verification_tokens', 'songs', 'shows', 'predictions', 'session', 'site_config'];
    let allTablesExist = true;
    
    console.log('Checking database tables...');
    for (const table of tables) {
      const result = await db.execute(sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${table}
      )`);
      
      const exists = result.rows[0]?.exists === true;
      if (!exists) {
        console.warn(`Table '${table}' does not exist, may need to be created manually`);
        allTablesExist = false;
      } else {
        console.log(`Table '${table}' exists`);
      }
    }
    
    return allTablesExist;
  } catch (error) {
    console.error('Error checking database tables:', error);
    throw error;
  }
}

// Run migrations
export async function runMigrations() {
  try {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');
    
    // Verify tables after migration
    await checkDatabaseTables();
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}