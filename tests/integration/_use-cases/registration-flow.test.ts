import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all sucessful)", () => {
  test("Create user account", async () => {
    const USER_TEST = {
      username: "RegistrationFlow",
      email: "registration.flow@email.com",
      password: "senha123",
    };

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

    const createUserResponseBody = await createUserResponse.json();
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

  test("Receive activation email", async () => {});
  test("Activate account", async () => {});
  test("Login", async () => {});
  test("Get user information", async () => {});
});
