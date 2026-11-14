import nodemailer from "nodemailer";

// Sends email through SMTP. Which account sends is set by environment variables, so
// switching from Gmail to another service (Brevo, Resend, ...) changes no code.
//
// MAIL_MODE decides what really happens, and the safe one is the default:
//   dry-run  (default) builds the email but delivers nothing.
//   redirect sends every email to MAIL_TEST_RECIPIENT instead of the real recipient,
//            with the real address shown in the subject. Use this to test the real
//            sender without emailing prospects.
//   send     delivers to the real recipient. Production only.
//
// SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 465), SMTP_USER and SMTP_PASS
// (a Gmail app password) are needed for redirect and send. MAIL_FROM_NAME is the display name.

export type MailMode = "dry-run" | "redirect" | "send";

export function getMailMode(): MailMode {
  const mode = process.env.MAIL_MODE;
  return mode === "send" || mode === "redirect" ? mode : "dry-run";
}

export type MailRequest = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments: { filename: string; content: Uint8Array; contentType: string }[];
};

export type MailResult = {
  mode: MailMode;
  // Where the email really went. null in dry-run, where nothing is delivered.
  deliveredTo: string | null;
  // What was built, so the caller (and the tests) can show or check it.
  subject: string;
  attachmentNames: string[];
};

export async function sendMail(request: MailRequest): Promise<MailResult> {
  const mode = getMailMode();
  const attachmentNames = request.attachments.map((a) => a.filename);
  const attachments = request.attachments.map((a) => ({
    filename: a.filename,
    content: Buffer.from(a.content),
    contentType: a.contentType,
  }));

  if (mode === "dry-run") {
    // jsonTransport builds the complete message and stops there.
    await nodemailer
      .createTransport({ jsonTransport: true })
      .sendMail({ from: "dry-run@localhost", ...request, attachments });
    return {
      mode,
      deliveredTo: null,
      subject: request.subject,
      attachmentNames,
    };
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error(
      "Email sending is not set up (SMTP_USER and SMTP_PASS are missing).",
    );
  }

  let to = request.to;
  let subject = request.subject;
  let text = request.text;
  if (mode === "redirect") {
    const testRecipient = process.env.MAIL_TEST_RECIPIENT;
    if (!testRecipient) {
      throw new Error(
        "MAIL_MODE is redirect but MAIL_TEST_RECIPIENT is not set.",
      );
    }
    subject = `[TEST for ${request.to}] ${request.subject}`;
    text = `This is a test. In real use this email goes to ${request.to}.\n\n${request.text}`;
    to = testRecipient;
  }

  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: port === 465, // 465 uses TLS from the start; 587 upgrades with STARTTLS
    auth: { user, pass },
  });
  await transport.sendMail({
    from: {
      name: process.env.MAIL_FROM_NAME ?? "Caritas Manila",
      address: user,
    },
    to,
    subject,
    text,
    replyTo: request.replyTo,
    attachments,
  });
  return { mode, deliveredTo: to, subject, attachmentNames };
}
