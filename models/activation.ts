import email from "@/infra/email";
import { User } from "./user";
import database from "@/infra/database";
import webserver from "@/infra/webserver";
import { NotFoundError } from "@/infra/errors";

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
  user_id: string;
  expires_at: Date;
  used_at: Date;
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

async function findOneValidById(token: string): Promise<UserActivationToken> {
  return runSelectQuery(token);

  async function runSelectQuery(token: string) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1 AND
        expires_at > NOW() AND
        used_at is NULL
      LIMIT
        1
      ;`,
      values: [token],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  findOneValidById,
};

export default activation;
