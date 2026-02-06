import { NextApiRequest, NextApiResponse } from "next";
import * as cookie from "cookie";
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "./errors";
import session from "@/models/session";
import user from "@/models/user";
import { NextApiRequestWithContext } from "@/types/infra/next";
import authorization, { UserWithFeatures } from "@/models/authorization";
import { Feature, features } from "@/models/feature";

// import { isErrorWithStatusCode } from "./utils";

function onNoMatchHandler(_request: NextApiRequest, response: NextApiResponse) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(
  error: unknown,
  _request: NextApiRequest,
  response: NextApiResponse,
) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }

  // const statusCode = isErrorWithStatusCode(error)
  //   ? error.statusCode
  //   : undefined;

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function setSessionCookie(
  response: NextApiResponse,
  sessionToken: string,
) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function clearSessionCookie(response: NextApiResponse) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function injectAuthenticatedUser(request: NextApiRequestWithContext) {
  const sessionToken = request.cookies.session_id!;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  request.context = {
    ...request.context,
    user: userObject,
  };
}

async function injectAnonymousUser(request: NextApiRequestWithContext) {
  const anonymousUserObject: UserWithFeatures = {
    features: [
      features.READ.ACTIVATION_TOKEN,
      features.CREATE.SESSION,
      features.CREATE.USER,
      features.READ.STATUS.DEFAULT,
    ],
  };

  request.context = {
    ...request.context,
    user: anonymousUserObject,
  };
}

async function injectAnonymousOrUser(
  request: NextApiRequest,
  _response: NextApiResponse,
  next: () => void,
) {
  const sessionToken = request.cookies?.session_id || null;
  if (sessionToken) {
    await injectAuthenticatedUser(request as NextApiRequestWithContext);
    return next();
  }

  await injectAnonymousUser(request as NextApiRequestWithContext);
  return next();
}

function canRequest(feature: Feature) {
  return function canRequestMidlware(
    request: NextApiRequestWithContext,
    _response: NextApiResponse,
    next: () => void,
  ) {
    const userTryingToRequest = request.context!.user as UserWithFeatures;

    if (authorization.can(userTryingToRequest, feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "Você não possui permissão para executar esta ação.",
      action: `Verifique se o seu usuário possui a feature "${feature}"`,
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
