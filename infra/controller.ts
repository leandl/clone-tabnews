import { NextApiRequest, NextApiResponse } from "next";
import { InternalServerError, MethodNotAllowedError } from "./errors";
import { isErrorWithStatusCode } from "./utils";

function onNoMatchHandler(_request: NextApiRequest, response: NextApiResponse) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(
  error: unknown,
  _request: NextApiRequest,
  response: NextApiResponse,
) {
  const statusCode = isErrorWithStatusCode(error)
    ? error.statusCode
    : undefined;

  const publicErrorObject = new InternalServerError({
    cause: error,
    statusCode: statusCode,
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
