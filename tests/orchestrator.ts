import retry from "async-retry";
import { faker } from "@faker-js/faker";

import migrator from "models/migrator";
import database from "infra/database";
import user, { UserCreateDTO } from "models/user";

async function waitForAllServices() {
  async function waitForWebServer() {
    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (!response.ok) {
        throw new Error();
      }
    }

    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });
  }

  await waitForWebServer();
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject?: Partial<UserCreateDTO>) {
  return await user.create({
    username:
      userObject?.username ?? faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject?.email ?? faker.internet.email(),
    password: userObject?.password ?? "validPassword",
  });
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
