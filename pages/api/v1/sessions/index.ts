import { NextApiRequest, NextApiResponse } from "next";

import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import authentication from "@/models/authentication";
import session from "@/models/session";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.post(postHandler);

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
