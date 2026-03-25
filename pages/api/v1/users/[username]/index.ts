import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import user, { User } from "models/user";
import { NextApiRequestWithContext } from "@/types/infra/next";
import authorization from "@/models/authorization";
import { ForbiddenError } from "@/infra/errors";
import { features } from "@/models/feature";

export default createRouter<NextApiRequest, NextApiResponse>()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest(features.UPDATE.USER.DEFAULT), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const userTryingToGet = request.context?.user as User;

  const username = request.query.username as string;
  const userFound = await user.findOneByUsername(username);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    features.READ.USER.DEFAULT,
    userFound,
  );

  return response.status(200).json(secureOutputValues);
}

async function patchHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const username = request.query.username as string;
  const userInputValues = request.body;

  const userTryingToPatch = request.context?.user as User;
  const targetUser = await user.findOneByUsername(username);

  if (
    !authorization.can(
      userTryingToPatch,
      features.UPDATE.USER.DEFAULT,
      targetUser,
    )
  ) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário.",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    features.READ.USER.DEFAULT,
    updatedUser,
  );

  return response.status(200).json(secureOutputValues);
}
