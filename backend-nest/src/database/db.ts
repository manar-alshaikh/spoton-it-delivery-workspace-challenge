import { Pool } from 'pg';

// Shared PostgreSQL connection pool used across all services.
// Reads DATABASE_URL from environment (set in .env).
export const db = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/spoton_challenge',
});
