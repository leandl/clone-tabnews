import { Client } from "pg";
import { ServiceError } from "./errors";

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
async function query(queryObject: any) {
  let client;
  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Erro na conexão com Banco ou na Query.",
      cause: error,
    });
    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  return process.env.NODE_ENV === "production";
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST ?? "",
    port: Number(process.env.POSTGRES_PORT ?? ""),
    user: process.env.POSTGRES_USER ?? "",
    database: process.env.POSTGRES_DB ?? "",
    password: process.env.POSTGRES_PASSWORD ?? "",
    ssl: getSSLValues(),
  });

  await client.connect();
  return client;
}

const database = {
  query,
  getNewClient,
};

export default database;
