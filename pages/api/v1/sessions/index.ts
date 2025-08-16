import { NextApiRequest, NextApiResponse } from "next";

import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import authentication from "@/models/authentication";
import session from "@/models/session";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request: NextApiRequest, response: NextApiResponse) {
  const userInputValues = request.body;

  const authenticateUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

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
