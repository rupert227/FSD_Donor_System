import { test, expect } from "@playwright/test";
import { getMailMode, sendMail } from "../src/lib/mail";

// Node-only tests for the mail sender. None of them reach a real mail server.

const request = {
  to: "someone@example.org",
  subject: "Partnership proposal",
  text: "Hello",
  attachments: [
    {
      filename: "Proposal_Test_2026.pdf",
      content: new Uint8Array([37, 80, 68, 70]),
      contentType: "application/pdf",
    },
  ],
};

test.describe("mail modes", () => {
  const saved = { ...process.env };
  test.afterEach(() => {
    process.env = { ...saved };
  });

  test("with nothing set, the mode is dry-run (the safe default)", () => {
    delete process.env.MAIL_MODE;
    expect(getMailMode()).toBe("dry-run");
    process.env.MAIL_MODE = "something-else";
    expect(getMailMode()).toBe("dry-run");
  });

  test("dry-run builds the email with its attachment and delivers nothing", async () => {
    delete process.env.MAIL_MODE;
    const result = await sendMail(request);
    expect(result).toEqual({
      mode: "dry-run",
      deliveredTo: null,
      subject: "Partnership proposal",
      attachmentNames: ["Proposal_Test_2026.pdf"],
    });
  });

  test("send mode without SMTP credentials fails instead of pretending", async () => {
    process.env.MAIL_MODE = "send";
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    await expect(sendMail(request)).rejects.toThrow(/not set up/);
  });

  test("redirect mode needs a test recipient so it can never reach the real one", async () => {
    process.env.MAIL_MODE = "redirect";
    process.env.SMTP_USER = "sender@example.org";
    process.env.SMTP_PASS = "not-a-real-password";
    delete process.env.MAIL_TEST_RECIPIENT;
    await expect(sendMail(request)).rejects.toThrow(/MAIL_TEST_RECIPIENT/);
  });
});
