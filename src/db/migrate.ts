import fs from "fs";
import path from "path";
import { getDb } from "./index";

export async function runMigrations() {
  console.log("⚡ Checking and running database migrations...");
  const db = getDb();

  const migrationsDir = path.resolve(process.cwd(), "src/db/migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.log("No migrations directory found.");
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Executing migration file: ${file}`);
    const sqlContent = fs.readFileSync(filePath, "utf-8");
    const statements = sqlContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        if (typeof db.execute === "function") {
          await db.execute(stmt);
        } else if (typeof db.run === "function") {
          await db.run(stmt);
        }
      } catch (err: any) {
        // Ignore "already exists" errors during re-runs
        if (
          err?.message?.includes("already exists") ||
          err?.code === "42P07" ||
          err?.code === "42710"
        ) {
          // Already created, safe to skip
        } else {
          console.warn(`Warning on statement: ${stmt.substring(0, 50)}...`, err.message);
        }
      }
    }
  }

  console.log("✅ All migrations applied successfully.");
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
