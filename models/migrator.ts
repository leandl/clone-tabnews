import database from "@/infra/database";
import migrationRunner, { RunnerOption } from "node-pg-migrate";
import { resolve } from "node:path";

const defaultMigrationOptions: Omit<RunnerOption, "dbClient"> = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  migrationsTable: "pgmigrations",
  verbose: true,
};

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });

    return pendingMigrations;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    return migratedMigrations;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
