import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import migrator from "@/models/migrator";
import { features } from "@/models/feature";
import { NextApiRequestWithContext } from "@/types/infra/next";
import authorization from "@/models/authorization";
import { User } from "@/models/user";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest(features.READ.MIGRATION), getHandler);
router.post(controller.canRequest(features.CREATE.MIGRATION), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const userTryingToGet = request.context?.user as User;
  const pendingMigrations = await migrator.listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    features.READ.MIGRATION,
    pendingMigrations,
  );

  return response.status(200).json(secureOutputValues);
}

async function postHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const userTryingToPost = request.context?.user as User;
  const migratedMigrations = await migrator.runPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    features.READ.MIGRATION,
    migratedMigrations,
  );

  if (migratedMigrations.length > 0) {
    return response.status(201).json(secureOutputValues);
  }

  return response.status(200).json(secureOutputValues);
}
