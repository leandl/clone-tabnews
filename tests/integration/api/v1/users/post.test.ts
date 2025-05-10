import orchestrator from "tests/orchestrator";
import user from "models/user";
import password from "models/password";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const USER_TEST = {
        username: "leandro",
        email: "leandro@email.com",
        password: "senha123",
      };

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: USER_TEST.username,
          email: USER_TEST.email,
          password: USER_TEST.password,
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: USER_TEST.username,
        email: USER_TEST.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername(USER_TEST.username);
      const correctPasswordMatch = await password.compare(
        USER_TEST.password,
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        USER_TEST.username,
        userInDatabase.password,
      );

      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated 'email'", async () => {
      const FIRST_USER_TEST = {
        username: "emailduplicado1",
        email: "duplicado@email.com",
        password: "senha123",
      };

      const SECOND_USER_TEST = {
        username: "emailduplicado2",
        email: "Duplicado@email.com",
        password: "senha123",
      };

      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: FIRST_USER_TEST.username,
          email: FIRST_USER_TEST.email,
          password: FIRST_USER_TEST.password,
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: SECOND_USER_TEST.username,
          email: SECOND_USER_TEST.email,
          password: SECOND_USER_TEST.password,
        }),
      });

      expect(response2.status).toBe(400);
      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With duplicated 'username'", async () => {
      const FIRST_USER_TEST = {
        username: "usernameduplicado",
        email: "duplicado1@email.com",
        password: "senha123",
      };

      const SECOND_USER_TEST = {
        username: "UsernameDuplicado",
        email: "duplicado2@email.com",
        password: "senha123",
      };

      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: FIRST_USER_TEST.username,
          email: FIRST_USER_TEST.email,
          password: FIRST_USER_TEST.password,
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: SECOND_USER_TEST.username,
          email: SECOND_USER_TEST.email,
          password: SECOND_USER_TEST.password,
        }),
      });

      expect(response2.status).toBe(400);
      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
  });
});
