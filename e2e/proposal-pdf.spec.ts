import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { writeFile } from "node:fs/promises";
import { buildProposalPdf } from "../src/lib/proposal-pdf";

// These run in Node and need no browser, database or sign-in.
// Set PDF_OUT=/some/folder to also save the PDFs so they can be looked at.

const LETTER = [
  "November 12, 2026",
  "**Ramon Rodriguez**\nSenior VP for Corporate Affairs\nSM Foundation Inc.\nSM Corporate Offices, Mall of Asia Complex, Pasay City",
  "Dear Mr. Rodriguez,",
  "Greetings of Peace and Compassion from Caritas Manila!",
  "Through your generous allocation of **₱1,500,000.00**, Caritas Manila will mobilize 5,000 relief packages for families in need — “Whatever you did for one of the least of these…”",
  "**Fr. Anton C.T. Pascual**\nExecutive Director",
].join("\n\n");

test("the proposal PDF is one US Letter page (8.5 x 11 in)", async () => {
  const bytes = await buildProposalPdf(LETTER);
  expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(1);
  const { width, height } = pdf.getPage(0).getSize();
  expect([width, height]).toEqual([612, 792]); // points: 8.5 x 72, 11 x 72
  if (process.env.PDF_OUT)
    await writeFile(`${process.env.PDF_OUT}/one-page.pdf`, bytes);
});

test("the peso sign, curly quotes and dashes are drawn without an error", async () => {
  await expect(
    buildProposalPdf("**₱1,500,000.00** — “quoted” • bullet"),
  ).resolves.toBeTruthy();
});

test("a long letter continues on more pages", async () => {
  const long = Array.from(
    { length: 40 },
    (_, i) =>
      `Paragraph ${i + 1}. ${"This sentence repeats to fill the page. ".repeat(6)}`,
  ).join("\n\n");
  const bytes = await buildProposalPdf(long);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBeGreaterThan(1);
  for (const page of pdf.getPages())
    expect(page.getSize()).toEqual({ width: 612, height: 792 });
  if (process.env.PDF_OUT)
    await writeFile(`${process.env.PDF_OUT}/long.pdf`, bytes);
});
