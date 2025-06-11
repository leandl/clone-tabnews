import session from "@/models/session";
import orchestrator from "tests/orchestrator";

import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` but correct `password`", async () => {
      const INCORRECT_EMAIL = "incorrect.email@gmail.com";
      const CORRECT_PASSWORD = "correct-password";

      await orchestrator.createUser({
        password: CORRECT_PASSWORD,
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: INCORRECT_EMAIL,
          password: CORRECT_PASSWORD,
        }),
      });

      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With correct `email` but incorrect `password`", async () => {
      const CORRECT_EMAIL = "correct.email@gmail.com";
      const INCORRECT_PASSWORD = "incorrect-password";

      await orchestrator.createUser({
        email: CORRECT_EMAIL,
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: CORRECT_EMAIL,
          password: INCORRECT_PASSWORD,
        }),
      });

      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With incorrect `email` and incorrect `password`", async () => {
      const INCORRECT_EMAIL = "incorrect-email@gmail.com";
      const INCORRECT_PASSWORD = "incorrect-password";

      await orchestrator.createUser();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: INCORRECT_EMAIL,
          password: INCORRECT_PASSWORD,
        }),
      });

      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With correct `email` and correct `password`", async () => {
      const CORRECT_PASSWORD_RAW = "132123";
      const userTest = await orchestrator.createUser({
        password: CORRECT_PASSWORD_RAW,
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userTest.email,
          password: CORRECT_PASSWORD_RAW,
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: userTest.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.token.length).toBe(96);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt.getTime() - createdAt.getTime()).toBe(
        session.EXPIRATION_IN_MILLISECONDS,
      );

      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).not.toBe(null);

      const parsedSetCookie = setCookieParser.parse(setCookieHeader as string, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: responseBody.token,
        path: "/",
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        httpOnly: true,
      });
    });
  });
});
