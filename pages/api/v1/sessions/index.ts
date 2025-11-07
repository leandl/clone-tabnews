import { NextApiRequest, NextApiResponse } from "next";

import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import authentication from "@/models/authentication";
import session from "@/models/session";
import { NextApiRequestWithContext } from "@/types/infra/next";
import authorization from "@/models/authorization";
import { ForbiddenError } from "@/infra/errors";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const userInputValues = request.body;

  const authenticateUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(authenticateUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que isto seja um erro.",
    });
  }

  const newSession = await session.create(authenticateUser.id);
  controller.setSessionCookie(response, newSession.token);

  return response.status(201).json(newSession);
}

async function deleteHandler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken!);
  const expiredSessionObject = await session.expireById(sessionObject.id);

  controller.clearSessionCookie(response);

  return response.status(200).json(expiredSessionObject);
}
