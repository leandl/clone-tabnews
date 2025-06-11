import crypto from "node:crypto";
import database from "@/infra/database";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 Days in ms

async function createSession(userId: string) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newSession = await runInsertQuery(userId, token, expiresAt);

  return newSession;

  async function runInsertQuery(
    userId: string,
    token: string,
    expiresAt: Date,
  ) {
    const results = await database.query({
      // text: `
      // INSERT INTO
      //   sessions (token, user_id, expires_at)
      // VALUES
      //   ($1,  $2, timezone('utc', now()) + interval '30 days')
      // RETURNING
      //   *
      // ;`,

      text: `
      INSERT INTO 
        sessions (token, user_id, expires_at) 
      VALUES 
        ($1,  $2, $3)
      RETURNING
        *
      ;`,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

const session = {
  create: createSession,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
