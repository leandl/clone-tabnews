import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import session from "@/models/session";
import user from "@/models/user";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request: NextApiRequest, response: NextApiResponse) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken!);
  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionCookie(response, renewedSessionObject.token);

  const userFound = await user.findOneById(renewedSessionObject.user_id);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(userFound);
}
