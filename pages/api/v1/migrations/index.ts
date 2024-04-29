import { join } from "node:path";
import migrationRunner, { RunnerOption } from "node-pg-migrate";

import { NextApiRequest, NextApiResponse } from "next";
import database from "@/infra/database";
import { Client as DBCLient } from "pg";

function getMigrationOptions(
  dbClient: DBCLient,
  inLiveRun: boolean
): RunnerOption {
  return {
    dbClient,
    dryRun: !inLiveRun,
    dir: join("infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    verbose: true,
  };
}

export default async function migrations(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method!)) {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
    });
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const inLiveRun = request.method === "POST";
    const migrationOptions: RunnerOption = getMigrationOptions(
      dbClient,
      inLiveRun
    );

    if (request.method === "GET") {
      const pendingMigrations = await migrationRunner(migrationOptions);
      return response.status(200).json(pendingMigrations);
    }

    const migratedMigrations = await migrationRunner(migrationOptions);
    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient?.end();
  }
}
