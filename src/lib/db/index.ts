/**
 * Database client initializer and configuration
 * Supports Prisma, Drizzle, Supabase, or native pg pool
 */

export interface DbConfig {
  connectionString?: string
}

export const dbConfig: DbConfig = {
  connectionString: process.env.DATABASE_URL,
}
