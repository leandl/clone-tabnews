import { resolve } from "node:path";
import migrationRunner, { RunnerOption } from "node-pg-migrate";

import { NextApiRequest, NextApiResponse } from "next";
import database from "@/infra/database";
import { Client as DBCLient } from "pg";
import { createRouter } from "next-connect";
import controller from "@/infra/controller";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

function getMigrationOptions(
  dbClient: DBCLient,
  inLiveRun: boolean,
): RunnerOption {
  return {
    dbClient,
    dryRun: !inLiveRun,
    dir: resolve("infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    verbose: true,
  };
}

async function getHandler(_request: NextApiRequest, response: NextApiResponse) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migrationOptions: RunnerOption = getMigrationOptions(dbClient, false);
    const pendingMigrations = await migrationRunner(migrationOptions);

    return response.status(200).json(pendingMigrations);
  } finally {
    await dbClient?.end();
  }
}

async function postHandler(
  _request: NextApiRequest,
  response: NextApiResponse,
) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migrationOptions: RunnerOption = getMigrationOptions(dbClient, true);
    const migratedMigrations = await migrationRunner(migrationOptions);

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  } finally {
    await dbClient?.end();
  }
}
