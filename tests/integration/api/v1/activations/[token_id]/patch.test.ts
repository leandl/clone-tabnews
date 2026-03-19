import activation from "@/models/activation";
import { features } from "@/models/feature";
import user from "@/models/user";
import orchestrator from "tests/orchestrator";

import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("With nonexistent token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/activations/e67be663-c904-41d5-9bc9-11d353d45499",
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        action: "Faça um novo cadastro.",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      const user = await orchestrator.createUser();
      const EXPIRED_SESSION_OFFSET_MS = -1;
      const expiredActivationToken =
        await orchestrator.createActivationTokenWithExpiration(
          user.id,
          EXPIRED_SESSION_OFFSET_MS,
        );

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        action: "Faça um novo cadastro.",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const response1 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response1.status).toBe(200);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response2.status).toBe(404);

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "NotFoundError",
        action: "Faça um novo cadastro.",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: activationToken.id,
        created_at: activationToken.created_at.toISOString(),
        expires_at: activationToken.expires_at.toISOString(),
        updated_at: responseBody.updated_at,
        used_at: responseBody.used_at,
        user_id: activationToken.user_id,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.used_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
      expect(responseBody.used_at > responseBody.created_at).toBe(true);

      const createdAt = new Date(responseBody.created_at);
      const expiresAt = new Date(responseBody.expires_at);

      expect(expiresAt.getTime() - createdAt.getTime()).toBe(
        activation.EXPIRATION_IN_MILLISECONDS,
      );

      const activatedUser = await user.findOneById(responseBody.user_id);
      expect(activatedUser.features).toEqual([
        features.CREATE.SESSION,
        features.READ.SESSION,
        features.UPDATE.USER.DEFAULT,
        features.READ.STATUS.DEFAULT,
      ]);
    });

    test("With valid token, but already activated user", async () => {
      const user = await orchestrator.createUser();
      await orchestrator.activateUser(user);
      const activationToken = await activation.create(user.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode mais utilizar tokens de ativação.",
        action: "Entre em contato com o suporte.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With valid token, but already logged in user", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1SessionObject = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.create(user2.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1SessionObject.token}`,
          },
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action:
          'Verifique se o seu usuário possui a feature "read:activation_token"',
        status_code: 403,
      });
    });
  });
});
