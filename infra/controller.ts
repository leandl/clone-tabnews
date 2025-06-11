import { NextApiRequest, NextApiResponse } from "next";
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";
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
    error instanceof UnauthorizedError
  ) {
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

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
