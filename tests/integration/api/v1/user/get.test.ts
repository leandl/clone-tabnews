import session from "@/models/session";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const user = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const sessionObject = await orchestrator.createSession(user.id);

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toEqual(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      // Session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);

      expect(
        renewedSessionObject.expires_at.getTime() -
          renewedSessionObject.updated_at,
      ).toBe(session.EXPIRATION_IN_MILLISECONDS);

      // Set-Cookie assertions
      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).not.toBe(null);

      const parsedSetCookie = setCookieParser.parse(setCookieHeader as string, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        path: "/",
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        httpOnly: true,
      });
    });

    test("With session at half-life still valid", async () => {
      const user = await orchestrator.createUser({
        username: "userWithHalfLifeSession",
      });

      const HALF_LIFE_MS = session.EXPIRATION_IN_MILLISECONDS / 2;
      const sessionObject = await orchestrator.createWithExpiration(
        user.id,
        HALF_LIFE_MS,
      );

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);

      expect(
        renewedSessionObject.expires_at.getTime() -
          renewedSessionObject.updated_at,
      ).toBe(session.EXPIRATION_IN_MILLISECONDS);

      // Set-Cookie assertions
      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).not.toBe(null);

      const parsedSetCookie = setCookieParser.parse(setCookieHeader as string, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        path: "/",
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        httpOnly: true,
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "164ed137d06cafffebc4c44d21f358a6bf8a79a2ff2009174c07a94c66e5c128fb94fa445897a2f3ff361069e700fb04";

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      const user = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      // tempo de expiração negativo = já expirado
      const EXPIRED_SESSION_OFFSET_MS = -1;
      const sessionObject = await orchestrator.createWithExpiration(
        user.id,
        EXPIRED_SESSION_OFFSET_MS,
      );
      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });
  });
});
