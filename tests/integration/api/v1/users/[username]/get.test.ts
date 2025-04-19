import orchestrator from "tests/orchestrator";

import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const USER_TEST = {
        username: "MesmoCase",
        email: "mesmo.case@email.com",
        password: "senha123",
      };

      const response1 = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${USER_TEST.username}`,
      );

      expect(response2.status).toBe(200);
      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: USER_TEST.username,
        email: USER_TEST.email,
        password: response2Body.password,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      const USERNAME_CASE_MISMATCH = "casediferente";
      const USER_TEST = {
        username: "CaseDiferente",
        email: "case.diferente@email.com",
        password: "senha123",
      };

      const response1 = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${USERNAME_CASE_MISMATCH}`,
      );

      expect(response2.status).toBe(200);
      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: USER_TEST.username,
        email: USER_TEST.email,
        password: response2Body.password,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });
  });

  test("With nonexistent username", async () => {
    const NONEXISTENT_USERNAME = "UsuarioInexistente";

    const response = await fetch(
      `http://localhost:3000/api/v1/users/${NONEXISTENT_USERNAME}`,
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
});
