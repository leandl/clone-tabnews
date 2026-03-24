import { NextApiRequest, NextApiResponse } from "next";

import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import authentication from "@/models/authentication";
import session from "@/models/session";
import { NextApiRequestWithContext } from "@/types/infra/next";
import authorization from "@/models/authorization";
import { ForbiddenError } from "@/infra/errors";
import { features } from "@/models/feature";
import { User } from "@/models/user";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest(features.CREATE.SESSION), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const userInputValues = request.body;

  const authenticateUser = await authentication.getUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(authenticateUser, features.CREATE.SESSION)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que isto seja um erro.",
    });
  }

  const newSession = await session.create(authenticateUser.id);
  controller.setSessionCookie(response, newSession.token);

  const secureOutputValues = authorization.filterOutput(
    authenticateUser,
    features.READ.SESSION,
    newSession,
  );

  return response.status(201).json(secureOutputValues);
}

async function deleteHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const sessionToken = request.cookies.session_id;
  const userTryingToDelete = request.context?.user as User;

  const sessionObject = await session.findOneValidByToken(sessionToken!);
  const expiredSessionObject = await session.expireById(sessionObject.id);

  controller.clearSessionCookie(response);

  const secureOutputValues = authorization.filterOutput(
    userTryingToDelete,
    features.READ.SESSION,
    expiredSessionObject,
  );

  return response.status(200).json(secureOutputValues);
}
