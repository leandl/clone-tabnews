import activation from "@/models/activation";
import user, { User } from "@/models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all sucessful)", () => {
  let createUserResponseBody: User;
  let activationTokenUUID: string;
  const USER_TEST = {
    username: "RegistrationFlow",
    email: "registration.flow@email.com",
    password: "senha123",
  };

  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: USER_TEST.username,
          email: USER_TEST.email,
          password: USER_TEST.password,
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();
    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: USER_TEST.username,
      email: USER_TEST.email,
      password: createUserResponseBody.password,
      features: ["read:activation_token"],
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail?.sender).toBe("<contato@tabnews.leandl.com.br>");
    expect(lastEmail?.recipients[0]).toBe(`<${USER_TEST.email}>`);
    expect(lastEmail?.subject).toBe("Ative seu cadastro no TabNews!");
    expect(lastEmail?.text).toContain(USER_TEST.username);

    activationTokenUUID = orchestrator.extractUUID(lastEmail?.text || "")!;
    const activationToken =
      await activation.findOneValidById(activationTokenUUID);

    expect(activationToken.user_id).toBe(createUserResponseBody.id);
    expect(activationToken.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenUUID}`,
      {
        method: "PATCH",
      },
    );

    expect(activationResponse.status).toBe(200);
    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername(USER_TEST.username);
    expect(activatedUser.features).toEqual(["create:session"]);
  });
  test("Login", async () => {});
  test("Get user information", async () => {});
});
