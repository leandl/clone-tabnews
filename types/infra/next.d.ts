import { NextApiRequest } from "next";

export type NextApiRequestWithContext = NextApiRequest & {
  context?: Record<string, unknown>;
};
