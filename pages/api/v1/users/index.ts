import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import user, { User } from "models/user";
import activation from "@/models/activation";
import { features } from "@/models/feature";
import { NextApiRequestWithContext } from "@/types/infra/next";
import authorization, { UserWithFeatures } from "@/models/authorization";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest(features.CREATE.USER), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const userInputValues = request.body;

  const userTryingToPatch = request.context?.user as User | UserWithFeatures;
  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    features.READ.USER.DEFAULT,
    newUser,
  );

  return response.status(201).json(secureOutputValues);
}
