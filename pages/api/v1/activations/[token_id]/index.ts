import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import activation from "@/models/activation";
import { features } from "@/models/feature";
import { NextApiRequestWithContext } from "@/types/infra/next";
import { User } from "@/models/user";
import authorization, { UserWithFeatures } from "@/models/authorization";

export default createRouter<NextApiRequest, NextApiResponse>()
  .use(controller.injectAnonymousOrUser)
  .patch(controller.canRequest(features.READ.ACTIVATION_TOKEN), patchHandler)
  .handler(controller.errorHandlers);

async function patchHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const activationTokenId = request.query.token_id as string;
  const userTryingToPatch = request.context?.user as User | UserWithFeatures;

  const validActivationToken =
    await activation.findOneValidById(activationTokenId);

  await activation.activateUserByUserId(validActivationToken.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenId);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    features.READ.ACTIVATION_TOKEN,
    usedActivationToken,
  );

  return response.status(200).json(secureOutputValues);
}
