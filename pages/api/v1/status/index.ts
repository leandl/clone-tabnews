import { NextApiRequest, NextApiResponse } from "next";
import database from "@/infra/database";

import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import authorization, { UserWithFeatures } from "@/models/authorization";
import { User } from "@/models/user";
import { NextApiRequestWithContext } from "@/types/infra/next";
import { features } from "@/models/feature";
import { APIStatus } from "@/models/status";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest(features.READ.STATUS.DEFAULT), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const userTryingToGet = request.context?.user as User | UserWithFeatures;

  const updatedAt = new Date().toISOString();
  const databaseVersionResult = await database.query("SHOW server_version;");
  const databaseVersionValue = databaseVersionResult.rows[0].server_version;

  const databaseMaxConnectionsResult = await database.query(
    "SHOW max_connections;",
  );
  const databaseMaxConnectionsValue =
    databaseMaxConnectionsResult.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const databaseOpenedConnectionsResult = await database.query({
    text: "SELECT count(*)::int as opened_connections FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const databaseOpenedConnectionsValue =
    databaseOpenedConnectionsResult.rows[0].opened_connections;

  const statusObject: APIStatus = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsValue),
        opened_connections: databaseOpenedConnectionsValue,
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    features.READ.STATUS.DEFAULT,
    statusObject,
  );

  response.status(200).json(secureOutputValues);
}
