import retry from "async-retry";
import { faker } from "@faker-js/faker";

import migrator from "models/migrator";
import database from "infra/database";
import user, { User, UserCreateDTO } from "models/user";
import session from "@/models/session";
import { MailAddress, MailcatcherMessage } from "@/types/infra/email";
import activation from "@/models/activation";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

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

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,

      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  await waitForWebServer();
  await waitForEmailServer();
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

async function activateUser(user: User) {
  return await activation.activateUserByUserId(user.id);
}

async function createActivationTokenWithExpiration(
  userId: string,
  expiresInMs: number,
) {
  return await activation.create(userId, expiresInMs);
}

async function createSession(userId: string) {
  return await session.create(userId);
}

async function createSessionWithExpiration(
  userId: string,
  expiresInMs: number,
) {
  return await session.createWithExpiration(userId, expiresInMs);
}

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

type EmailData = {
  sender: MailAddress;
  recipients: MailAddress[];
  subject: string;
  text: string;
};

async function getLastEmail(): Promise<EmailData | null> {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);

  const emailListBody: MailcatcherMessage[] = await emailListResponse.json();
  if (emailListBody.length === 0) {
    return null;
  }

  const lastEmailItemIndex = emailListBody.length - 1;
  const lastEmailItem = emailListBody[lastEmailItemIndex];

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );

  const emailTextBody = await emailTextResponse.text();

  return {
    sender: lastEmailItem.sender,
    recipients: lastEmailItem.recipients,
    subject: lastEmailItem.subject,
    text: emailTextBody,
  };
}

function extractUUID(text: string): string | null {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  activateUser,
  createActivationTokenWithExpiration,
  createSession,
  createSessionWithExpiration,
  deleteAllEmails,
  getLastEmail,
  extractUUID,
};

export default orchestrator;
