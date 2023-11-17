import { NextApiRequest, NextApiResponse } from "next";
import database from "@/infra/database";

export default async function status(
  _request: NextApiRequest,
  response: NextApiResponse
) {
  const result = await database.query("SELECT 1 + 1 as SUM");
  console.log(result.rows);
  return response.status(200).json({ chave: "valor" });
}
