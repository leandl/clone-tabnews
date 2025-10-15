import email from "@/infra/email";
import { User } from "./user";
import database from "@/infra/database";
import webserver from "@/infra/webserver";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 Minutes in ms

async function sendEmailToUser(
  user: User,
  activationToken: UserActivationToken,
) {
  await email.send({
    from: "TabNews <contato@tabnews.leandl.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no TabNews!",
    text: `${user.username}, click no link abaixo para ativar seu cadastro no TabNews:
    
${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente
Equipe TabNews
    `,
  });
}

export type UserActivationToken = {
  id: string;
  user_at: Date;
  user_id: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};

async function create(
  userId: string,
  expirationInMs: number = EXPIRATION_IN_MILLISECONDS,
): Promise<UserActivationToken> {
  const newToken = await runInsertQuery(userId, expirationInMs);

  return newToken;

  async function runInsertQuery(userId: string, expirationInMs: number) {
    const results = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, timezone('utc', now()) + ($2 || ' milliseconds')::interval)
      RETURNING
        *
      ;`,
      values: [userId, expirationInMs],
    });

    return results.rows[0];
  }
}

async function findOneByUserId(userId: string): Promise<UserActivationToken> {
  return runSelectQuery(userId);

  async function runSelectQuery(userId: string) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
      LIMIT
        1
      ;`,
      values: [userId],
    });

    return results.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  findOneByUserId,
};

export default activation;
