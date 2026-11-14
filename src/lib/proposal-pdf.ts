import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

// Builds the proposal letter as a PDF, on the server, so it can be attached to an email.
// It follows the sheet drawn by LetterPreview: US Letter (8.5 x 11 in), 1 in side margins,
// letterhead, 11 pt body text with 1.5 line height, and the address footer. The letter
// text uses the same markup as the preview: a blank line starts a paragraph, a single
// line break stays a line break, and **text** is bold.
//
// Imports are relative (no "@/" alias) so this file can also run outside Next.js, for tests.

// Everything below is in PDF points (1 pt = 1/72 in). The preview is drawn at 96 px per
// inch, so 1 px = 0.75 pt.
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 72; // 1 in, the preview's px-24
const MARGIN_TOP = 54; // 0.75 in
const MARGIN_BOTTOM = 36; // 0.5 in
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const BODY_SIZE = 11;
const BODY_LINE = BODY_SIZE * 1.5;
const PARAGRAPH_GAP = 9; // 12 px
const FOOTER_SIZE = 9;
const FOOTER_LINE = FOOTER_SIZE * 1.375;

const BRAND = rgb(0x6b / 255, 0x0f / 255, 0x0f / 255);
const GREY_TEXT = rgb(0.42, 0.45, 0.5);
const GREY_RULE = rgb(0.82, 0.84, 0.86);

export const FOOTER_TEXT =
  "2002 Jesus Street, Pandacan, Manila, Metro Manila • Tel: (02) 8562-0020 • Mobile: +63 917 800 2274 | www.caritasmanila.org.ph";

// The fonts and logo live in the project. Paths start at the project root, which is the
// working directory when the app runs (or when the tests run).
const FONT_REGULAR = path.join(
  process.cwd(),
  "src/assets/fonts/NotoSans-Regular.ttf",
);
const FONT_BOLD = path.join(
  process.cwd(),
  "src/assets/fonts/NotoSans-Bold.ttf",
);
const LOGO = path.join(process.cwd(), "public/caritas_logo.png");

// A piece of text in one style. A chunk is the pieces that touch each other with no space
// between them (like "**₱1,500,000.00**," = a bold piece and a plain comma), so a line is
// never broken inside one and no space appears between them.
type Piece = { text: string; bold: boolean };
type Chunk = Piece[];

// Splits one line of letter text into chunks, remembering which pieces are inside **bold**.
function toChunks(line: string): Chunk[] {
  const chunks: Chunk[] = [];
  let touching = false; // true while the next piece continues the previous chunk
  line.split(/(\*\*.+?\*\*)/).forEach((part) => {
    const bold =
      part.startsWith("**") && part.endsWith("**") && part.length > 4;
    const text = bold ? part.slice(2, -2) : part;
    (text.match(/\S+|\s+/g) ?? []).forEach((token) => {
      if (/^\s+$/.test(token)) {
        touching = false;
        return;
      }
      if (touching && chunks.length > 0)
        chunks[chunks.length - 1].push({ text: token, bold });
      else chunks.push([{ text: token, bold }]);
      touching = true;
    });
  });
  return chunks;
}

type Fonts = { regular: PDFFont; bold: PDFFont };

function fontFor(piece: Piece, fonts: Fonts) {
  return piece.bold ? fonts.bold : fonts.regular;
}

function chunkWidth(chunk: Chunk, fonts: Fonts, size: number) {
  return chunk.reduce(
    (sum, p) => sum + fontFor(p, fonts).widthOfTextAtSize(p.text, size),
    0,
  );
}

// Breaks the chunks into lines that fit the content width.
function wrap(chunks: Chunk[], fonts: Fonts, size: number): Chunk[][] {
  const space = fonts.regular.widthOfTextAtSize(" ", size);
  const lines: Chunk[][] = [];
  let line: Chunk[] = [];
  let width = 0;
  for (const chunk of chunks) {
    const w = chunkWidth(chunk, fonts, size);
    const needed = line.length === 0 ? w : width + space + w;
    if (needed > CONTENT_WIDTH && line.length > 0) {
      lines.push(line);
      line = [chunk];
      width = w;
    } else {
      line.push(chunk);
      width = needed;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

// Draws one wrapped line, switching font for bold pieces.
function drawLine(
  page: PDFPage,
  line: Chunk[],
  fonts: Fonts,
  size: number,
  x: number,
  y: number,
) {
  const space = fonts.regular.widthOfTextAtSize(" ", size);
  let cursor = x;
  line.forEach((chunk, i) => {
    chunk.forEach((piece) => {
      const font = fontFor(piece, fonts);
      page.drawText(piece.text, {
        x: cursor,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      cursor += font.widthOfTextAtSize(piece.text, size);
    });
    if (i < line.length - 1) cursor += space;
  });
}

// Letterhead: logo, name, ministry bar and a rule underneath. Returns the y where the body starts.
async function drawLetterhead(
  doc: PDFDocument,
  page: PDFPage,
  fonts: Fonts,
): Promise<number> {
  const top = PAGE_HEIGHT - MARGIN_TOP;
  const logoSize = 63; // 84 px
  const logo = await doc.embedPng(await readFile(LOGO));
  page.drawImage(logo, {
    x: MARGIN_X,
    y: top - logoSize,
    width: logoSize,
    height: logoSize,
  });

  const textX = MARGIN_X + logoSize + 15; // 20 px gap
  const nameSize = 21; // 28 px
  const name = "CARITAS MANILA";
  const nameY = top - logoSize / 2 + 6;
  page.drawText(name, {
    x: textX,
    y: nameY,
    size: nameSize,
    font: fonts.bold,
    color: BRAND,
  });

  // The black ministry bar under the name.
  const barText = "Social Services and Development Ministry";
  const barSize = 9.75; // 13 px
  const barWidth = fonts.regular.widthOfTextAtSize(barText, barSize) + 18;
  const barHeight = 20;
  const barY = nameY - 8 - barHeight;
  page.drawRectangle({
    x: textX,
    y: barY,
    width: barWidth,
    height: barHeight,
    color: rgb(0, 0, 0),
  });
  page.drawText(barText, {
    x: textX + 9,
    y: barY + 6.5,
    size: barSize,
    font: fonts.regular,
    color: rgb(1, 1, 1),
  });

  // The rule under the letterhead (20 px below the logo).
  const ruleY = top - logoSize - 15;
  page.drawLine({
    start: { x: MARGIN_X, y: ruleY },
    end: { x: PAGE_WIDTH - MARGIN_X, y: ruleY },
    thickness: 0.75,
    color: rgb(0.6, 0.35, 0.35),
  });
  return ruleY - 18; // 24 px of space before the body
}

// The address footer, centred, with a rule above it. Returns the y of its top edge.
function drawFooter(page: PDFPage, fonts: Fonts): number {
  const lines = wrap(toChunks(FOOTER_TEXT), fonts, FOOTER_SIZE);
  const textTop = MARGIN_BOTTOM + lines.length * FOOTER_LINE;
  lines.forEach((line, i) => {
    const text = line
      .map((chunk) => chunk.map((p) => p.text).join(""))
      .join(" ");
    const width = fonts.regular.widthOfTextAtSize(text, FOOTER_SIZE);
    page.drawText(text, {
      x: (PAGE_WIDTH - width) / 2,
      y: textTop - (i + 1) * FOOTER_LINE + 3,
      size: FOOTER_SIZE,
      font: fonts.regular,
      color: GREY_TEXT,
    });
  });
  const ruleY = textTop + 9; // 12 px of padding above the text
  page.drawLine({
    start: { x: MARGIN_X, y: ruleY },
    end: { x: PAGE_WIDTH - MARGIN_X, y: ruleY },
    thickness: 0.75,
    color: GREY_RULE,
  });
  return ruleY;
}

// Returns the PDF file's bytes for a letter. A letter that does not fit one page continues
// on more pages (letterhead on the first, footer on every page).
export async function buildProposalPdf(
  letterText: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts: Fonts = {
    regular: await doc.embedFont(await readFile(FONT_REGULAR), {
      subset: true,
    }),
    bold: await doc.embedFont(await readFile(FONT_BOLD), { subset: true }),
  };
  doc.setTitle("Proposal");
  doc.setProducer("Caritas Manila FSD Donor System");

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let footerTop = drawFooter(page, fonts);
  let y = await drawLetterhead(doc, page, fonts);

  // Paragraphs are separated by a blank line; lines inside one stay separate.
  letterText.split("\n\n").forEach((paragraph, index) => {
    if (index > 0) y -= PARAGRAPH_GAP;
    paragraph.split("\n").forEach((rawLine) => {
      const lines =
        rawLine.trim() === ""
          ? [[]]
          : wrap(toChunks(rawLine), fonts, BODY_SIZE);
      lines.forEach((line) => {
        // Leave a gap above the footer; start a new page when the next line would cross it.
        if (y - BODY_LINE < footerTop + 12) {
          page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          footerTop = drawFooter(page, fonts);
          y = PAGE_HEIGHT - MARGIN_TOP;
        }
        // Text is placed by its baseline, so move down by the line height first.
        y -= BODY_LINE;
        drawLine(page, line, fonts, BODY_SIZE, MARGIN_X, y + 4.5);
      });
    });
  });

  return doc.save();
}
