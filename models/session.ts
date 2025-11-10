import crypto from "node:crypto";
import database from "@/infra/database";
import { UnauthorizedError } from "@/infra/errors";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 Days in ms

export type Session = {
  id: string;
  token: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};

async function createSession(
  userId: string,
  expirationInMs: number = EXPIRATION_IN_MILLISECONDS, // valor padrão
): Promise<Session> {
  const token = crypto.randomBytes(48).toString("hex");
  const newSession = await runInsertQuery(userId, token, expirationInMs);

  return newSession;

  async function runInsertQuery(
    userId: string,
    token: string,
    expirationInMs: number,
  ) {
    const results = await database.query({
      text: `
      INSERT INTO
        sessions (token, user_id, expires_at)
      VALUES
        ($1, $2, timezone('utc', now()) + ($3 || ' milliseconds')::interval)
      RETURNING
        *
      ;`,
      values: [token, userId, expirationInMs],
    });

    return results.rows[0];
  }
}

async function createSessionWithDefaultExpiration(userId: string) {
  return await createSession(userId);
}

async function createSessionWithCustomExpiration(
  userId: string,
  expiresInMs: number,
): Promise<Session> {
  return await createSession(userId, expiresInMs);
}

async function findOneValidByToken(token: string): Promise<Session> {
  return runSelectQuery(token);

  async function runSelectQuery(token: string) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        sessions
      WHERE
        token = $1 AND
        expires_at > NOW()
      LIMIT
        1
      ;`,
      values: [token],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
      });
    }

    return results.rows[0];
  }
}

async function renew(sessionId: string): Promise<Session> {
  const renewSession = await runUpdateQuery(
    sessionId,
    EXPIRATION_IN_MILLISECONDS,
  );

  return renewSession;

  async function runUpdateQuery(sessionId: string, expirationInMs: number) {
    const results = await database.query({
      text: `
      UPDATE
        sessions
      SET
        expires_at = timezone('utc', now()) + ($2 || ' milliseconds')::interval,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [sessionId, expirationInMs],
    });

    return results.rows[0];
  }
}

async function expireById(sessionId: string): Promise<Session> {
  const expiredSessionObject = await runUpdateQuery(sessionId);
  return expiredSessionObject;

  async function runUpdateQuery(sessionId: string) {
    const results = await database.query({
      text: `
      UPDATE
        sessions
      SET
        expires_at = timezone('utc', now()) - interval '1 year',
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [sessionId],
    });

    return results.rows[0];
  }
}

const session = {
  create: createSessionWithDefaultExpiration,
  createWithExpiration: createSessionWithCustomExpiration,
  findOneValidByToken,
  renew,
  expireById,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
