import * as schema from "./schema";

let dbInstance: any = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.startsWith("postgres")) {
    try {
      // If running in Neon / standard PostgreSQL environment
      if (databaseUrl.includes("neon.tech")) {
        const { Pool, neonConfig } = require("@neondatabase/serverless");
        const { drizzle } = require("drizzle-orm/neon-serverless");
        const pool = new Pool({ connectionString: databaseUrl });
        dbInstance = drizzle(pool, { schema });
        return dbInstance;
      } else {
        const { Pool } = require("pg");
        const { drizzle } = require("drizzle-orm/node-postgres");
        const pool = new Pool({ connectionString: databaseUrl });
        dbInstance = drizzle(pool, { schema });
        return dbInstance;
      }
    } catch (e) {
      console.warn("Failed to connect via remote PostgreSQL driver, falling back to PGlite:", e);
    }
  }

  // Local / Zero-dependency embedded fallback with PGlite
  const { PGlite } = require("@electric-sql/pglite");
  const { drizzle } = require("drizzle-orm/pglite");
  const path = require("path");
  const fs = require("fs");

  const dataDir = path.resolve(process.cwd(), ".pglite-data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const client = new PGlite(dataDir);
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export const db = new Proxy({} as any, {
  get(_target, prop) {
    const realDb = getDb();
    const value = realDb[prop];
    return typeof value === "function" ? value.bind(realDb) : value;
  },
});

export default db;
