import database from "@/infra/database";
import password from "@/models/password";
import { NotFoundError, ValidationError } from "@/infra/errors";

async function validateUniqueUsername(username: string) {
  const results = await database.query({
    text: `
    SELECT
      username
    FROM
      users
    WHERE
      LOWER(username) = LOWER($1)
    ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado.",
      action: "Utilize outro username para realizar esta operação.",
    });
  }
}

async function validateUniqueEmail(email: string) {
  const results = await database.query({
    text: `
    SELECT
      email
    FROM
      users
    WHERE
      LOWER(email) = LOWER($1)
    ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Utilize outro email para realizar esta operação.",
    });
  }
}

type ChangePasswordDTO = {
  password: string;
};

async function hashPasswordInObject(input: ChangePasswordDTO) {
  const hashedPassword = await password.hash(input.password);
  input.password = hashedPassword;
}

async function findOneByUsername(username: string) {
  return runSelectQuery(username);

  async function runSelectQuery(username: string) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
};

export type UserCreateDTO = {
  username: string;
  email: string;
  password: string;
};

async function create(userInputValues: UserCreateDTO): Promise<User> {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues: UserCreateDTO) {
    const results = await database.query({
      text: `
      INSERT INTO 
        users (username, email, password) 
      VALUES 
        ($1, $2, $3)
      RETURNING
        *
      ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return results.rows[0];
  }
}

type UserUpdateDTO = {
  username?: string;
  email?: string;
  password?: string;
};

async function update(
  username: string,
  userInputValues: UserUpdateDTO,
): Promise<User> {
  const currentUser = await findOneByUsername(username);

  if (typeof userInputValues.username === "string") {
    await validateUniqueUsername(userInputValues.username);
  }

  if (typeof userInputValues.email === "string") {
    await validateUniqueEmail(userInputValues.email);
  }

  if (typeof userInputValues.password === "string") {
    await hashPasswordInObject(userInputValues as ChangePasswordDTO);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };
  const updatedUser = runUpdatetQuery(userWithNewValues);
  return updatedUser;

  async function runUpdatetQuery(userWithNewValues: User) {
    const results = await database.query({
      text: `
      UPDATE
        users
      SET
        username = $2,
        email = $3,
        password = $4,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return results.rows[0];
  }
}

const user = {
  create,
  update,
  findOneByUsername,
};

export default user;
