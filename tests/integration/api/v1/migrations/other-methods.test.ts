import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

const allMethodForTest = ["HEAD", "PUT", "DELETE", "OPTIONS", "PATCH"] as const;
type Method = (typeof allMethodForTest)[number];

async function getMigrationsResponse(method: Method) {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method,
  });
  return response;
}

async function getDataBaseStatus() {
  const response = await fetch("http://localhost:3000/api/v1/status");
  return await response.json();
}

test("OTHER HTTP METHODS to /api/v1/migrations should not let opened connections in database", async () => {
  for (const method of allMethodForTest) {
    const migrationsResponse = await getMigrationsResponse(method);
    expect(migrationsResponse.status).toBe(405);

    const status = await getDataBaseStatus();
    expect(status.dependencies.database.opened_connections).toEqual(1);
  }
});
