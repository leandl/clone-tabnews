import { join } from "node:path";
import migrationRunner, { RunnerOption } from "node-pg-migrate";

import { NextApiRequest, NextApiResponse } from "next";
import database from "@/infra/database";

export default async function migrations(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method !== "GET" && request.method !== "POST") {
    return response.status(405).json({});
  }

  const dbClient = await database.getNewClient();
  const defaultMigrationOptions: RunnerOption = {
    dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    verbose: true,
  };

  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationOptions);
    await dbClient.end();
    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    await dbClient.end();

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  }
}
