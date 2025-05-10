import password from "@/models/password";
import user from "@/models/user";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent 'username'", async () => {
      const NONEXISTENT_USERNAME = "UsuarioInexistente";

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${NONEXISTENT_USERNAME}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      const FIRST_USER_TEST = {
        username: "user1",
        email: "user1@email.com",
        password: "senha123",
      };

      const SECOND_USER_TEST = {
        username: "user2",
        email: "user2@email.com",
        password: "senha123",
      };

      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(user2Response.status).toBe(201);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${SECOND_USER_TEST.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: FIRST_USER_TEST.username,
          }),
        },
      );

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      const FIRST_USER_TEST = {
        username: "email1",
        email: "email1@email.com",
        password: "senha123",
      };

      const SECOND_USER_TEST = {
        username: "email2",
        email: "email2@email.com",
        password: "senha123",
      };

      const email1Response = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(email1Response.status).toBe(201);

      const email2Response = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(email2Response.status).toBe(201);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${SECOND_USER_TEST.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: FIRST_USER_TEST.email,
          }),
        },
      );

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const USER_TEST = {
        username: "uniqueUser1",
        email: "uniqueUser1@email.com",
        password: "senha123",
      };

      const USERNAME_TEST = "uniqueUser2";

      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(user1Response.status).toBe(201);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${USER_TEST.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: USERNAME_TEST,
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: USERNAME_TEST,
        email: USER_TEST.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const USER_TEST = {
        username: "uniqueEmail1",
        email: "uniqueEmail1@email.com",
        password: "senha123",
      };

      const EMAIL_TEST = "uniqueEmail2";

      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(user1Response.status).toBe(201);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${USER_TEST.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: EMAIL_TEST,
          }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: USER_TEST.username,
        email: EMAIL_TEST,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const USER_TEST = {
        username: "newPassword1",
        email: "newPassword1@email.com",
        password: "newPassword1",
      };

      const PASSWORD_TEST = "newPassword2";

      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(user1Response.status).toBe(201);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${USER_TEST.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: PASSWORD_TEST,
          }),
        },
      );

      expect(response.status).toBe(200);
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
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(USER_TEST.username);
      const correctPasswordMatch = await password.compare(
        PASSWORD_TEST,
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        USER_TEST.password,
        userInDatabase.password,
      );

      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
