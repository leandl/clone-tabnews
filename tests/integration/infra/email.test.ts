import email from "@/infra/email";
import orchestrator from "@/tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.ts", () => {
  test("send()", async () => {
    orchestrator.deleteAllEmails();

    await email.send({
      from: "Tabnews <contato@test.com.br>",
      to: "Client <client@test.com.br>",
      subject: "Último email enviado",
      text: "Corpo do último email.",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail!.sender).toBe("<contato@test.com.br>");
    expect(lastEmail!.recipients[0]).toBe("<client@test.com.br>");
    expect(lastEmail!.subject).toBe("Último email enviado");
    expect(lastEmail!.text).toBe("Corpo do último email.\r\n");
  });
});
