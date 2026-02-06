import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import controller from "@/infra/controller";
import session from "@/models/session";
import user, { User } from "@/models/user";
import { features } from "@/models/feature";
import { NextApiRequestWithContext } from "@/types/infra/next";
import authorization from "@/models/authorization";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest(features.READ.SESSION), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(
  request: NextApiRequestWithContext,
  response: NextApiResponse,
) {
  const sessionToken = request.cookies.session_id;

  const userTryingToGet = request.context?.user as User;

  const sessionObject = await session.findOneValidByToken(sessionToken!);
  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionCookie(response, renewedSessionObject.token);

  const userFound = await user.findOneById(renewedSessionObject.user_id);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    features.READ.USER.SELF,
    userFound,
  );

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(secureOutputValues);
}
