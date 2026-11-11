"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut } from "lucide-react";

// US Letter (8.5 x 11 in) at 96 pixels per inch.
const SHEET_WIDTH = 816;
const SHEET_HEIGHT = 1056;

// Zoom limits and step, in percent.
const MIN_ZOOM = 25;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;

// Square 32px button with just an icon, for zooming.
const iconButtonClass =
  "hover:bg-surface-soft-hover inline-flex size-8 cursor-pointer items-center justify-center rounded-[6px] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";
const fitButtonClass =
  "border-border-strong hover:bg-surface-soft-hover ml-1 inline-flex h-8 cursor-pointer items-center rounded-[6px] border bg-white px-3 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white";

const FOOTER_TEXT =
  "2002 Jesus Street, Pandacan, Manila, Metro Manila • Tel: (02) 8562-0020 • Mobile: +63 917 800 2274 | www.caritasmanila.org.ph";

type LetterPreviewProps = {
  text: string;
  // Called with true when the letter runs past one page, false when it fits.
  onOverflowChange?: (runsPastOnePage: boolean) => void;
  // When given, the letter body becomes a text box and this receives each edit.
  onTextChange?: (text: string) => void;
  // The toolbar above the sheet: the parent fills in the start and the end, and
  // the zoom controls (which belong to the sheet) sit between them.
  toolbarLeading?: ReactNode;
  toolbarTrailing?: ReactNode;
  // While editing: select this exact text in the text box and move focus to it,
  // then call onTextSelected so the parent can clear the request.
  selectText?: string | null;
  onTextSelected?: () => void;
};

// Matches **bold text**, [prompts for the officer] and {placeholders}.
const markupPattern = /(\*\*.+?\*\*|\[[^\]\n]+\]|\{\w+\})/;
const promptPattern = /^(\[[^\]\n]+\]|\{\w+\})$/;

// Turns **text** into bold, and shows [prompts] and unfilled {placeholders}
// with a soft highlight so the officer sees what to change. Everything else
// stays plain text, and React escapes it, so typed characters like < or >
// can never run as code.
function renderMarkup(paragraph: string) {
  return paragraph.split(markupPattern).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (promptPattern.test(part)) {
      return (
        // A soft tint and a dotted underline mark "fill this in": quieter than
        // bold on a bright highlight. Neither prints, so the PDF stays clean.
        <span
          key={index}
          className="bg-surface-warning-strong decoration-icon-warning rounded-[2px] underline decoration-dotted underline-offset-4 print:bg-transparent print:no-underline"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function LetterPreview({
  text,
  onOverflowChange,
  onTextChange,
  toolbarLeading,
  toolbarTrailing,
  selectText,
  onTextSelected,
}: LetterPreviewProps) {
  const editing = onTextChange !== undefined;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // A blank line in the text starts a new paragraph.
  const paragraphs = text.split("\n\n");

  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // The sheet is always drawn at its real size, then scaled by the zoom.
  // The zoom (in percent) the user picked with the buttons. null means they
  // have not picked one yet, so the sheet shows at 100% or shrinks to fit.
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(SHEET_WIDTH);
  const [sheetHeight, setSheetHeight] = useState(SHEET_HEIGHT);
  // Which mode the sheetHeight above was measured in. Right after a switch the
  // old height is still stored, and it must not be used for the new mode.
  const [measuredEditing, setMeasuredEditing] = useState(editing);
  // True for a moment after a zoom click, so only that change is eased.
  const [zooming, setZooming] = useState(false);
  const zoomTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The zoom at which the sheet exactly fills the available width.
  const exactFit = Math.floor((containerWidth / SHEET_WIDTH) * 100);
  // Within 3% of 100%, snap to 100% (a scrollbar can take a few pixels).
  const fitZoom = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, exactFit >= 97 && exactFit < 100 ? 100 : exactFit),
  );
  // Until the user zooms, show the sheet at 100%, or smaller if the space is
  // narrower, so the letter never opens cropped. It follows the window size.
  const zoom = manualZoom ?? Math.min(100, fitZoom);
  const scale = zoom / 100;
  // Ease between zoom levels only right after a zoom click. Window resizes and
  // Preview/Edit switches change the size too, and those must stay instant, or
  // the frame would trail behind the sheet.
  const zoomTransition = zooming
    ? "width 200ms ease-out, height 200ms ease-out"
    : undefined;

  function changeZoom(value: number) {
    setManualZoom(value);
    setZooming(true);
    clearTimeout(zoomTimer.current);
    zoomTimer.current = setTimeout(() => setZooming(false), 250);
  }

  useEffect(() => () => clearTimeout(zoomTimer.current), []);

  useEffect(() => {
    const container = containerRef.current;
    const sheet = sheetRef.current;
    if (!container || !sheet) return;

    // Runs once when observing starts, then again whenever either size changes.
    const observer = new ResizeObserver(() => {
      setContainerWidth(container.clientWidth);
      setSheetHeight(sheet.offsetHeight);
    });
    observer.observe(container);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  // The text box makes the sheet fit its text, like a real document. These two
  // run before the browser paints, so switching between Preview and Edit never
  // shows a frame with the old height.
  useLayoutEffect(() => {
    const box = textareaRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${box.scrollHeight}px`;
  }, [text, editing]);

  // Jump to a prompt: focus the text box and select the requested text. This
  // also runs when the mode has just switched to Edit, because the text box
  // only exists from that render on.
  useLayoutEffect(() => {
    const box = textareaRef.current;
    if (!selectText || !box) return;
    const start = text.indexOf(selectText);
    if (start !== -1) {
      box.focus();
      box.setSelectionRange(start, start + selectText.length);
    }
    onTextSelected?.();
  }, [selectText, editing, text, onTextSelected]);

  // Measure the sheet right after the text or the mode changes.
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    setSheetHeight(sheet.offsetHeight);
    setMeasuredEditing(editing);
  }, [text, editing]);

  // The sheet grows taller when the letter is too long for one page. While
  // editing, blank lines are taller than the paragraph gaps in the preview, so
  // the length is only judged in Preview, where it matches the printout.
  const runsPastOnePage =
    !editing && !measuredEditing && sheetHeight > SHEET_HEIGHT + 1;

  // Tell the parent whenever the answer changes.
  useEffect(() => {
    onOverflowChange?.(runsPastOnePage);
  }, [runsPastOnePage, onOverflowChange]);

  return (
    <div>
      {/* Print settings that only apply while a letter is on the page, so the
          team's other printouts keep their own page settings:
          - @page: Letter, portrait, no browser margins (the sheet has its own).
          - min-width: globals.css gives html and body 1000px, which is wider
            than a Letter page, so the browser would shrink the printout. */}
      <style>{`@page { size: 8.5in 11in; margin: 0; } @media print { html, body { min-width: 0 !important; } }`}</style>
      {/* Toolbar (not printed) */}
      <div className="no-print border-border-soft flex items-center gap-2 border-b px-4 py-2.5">
        {toolbarLeading}
        <div className="ml-auto flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => changeZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            className={iconButtonClass}
          >
            <ZoomOut className="size-[18px]" aria-hidden="true" />
          </button>
          <span className="text-text-secondary w-12 text-center text-[13px] font-medium tabular-nums">
            {zoom}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => changeZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            className={iconButtonClass}
          >
            <ZoomIn className="size-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => changeZoom(fitZoom)}
            disabled={zoom === fitZoom}
            className={fitButtonClass}
          >
            Fit
          </button>
        </div>
        {toolbarTrailing}
      </div>

      {/* The grey viewer around the sheet */}
      <div className="bg-surface-soft p-6 print:bg-transparent print:p-0">
        {runsPastOnePage && (
          // Not role="status": the checklist row already reports the length,
          // and the Generate warning announces it, so it is not read out three times.
          <p className="animate-in fade-in-0 no-print border-border-warning bg-surface-amber text-text-warning mb-3 rounded-[6px] border px-3 py-2 text-sm">
            This letter runs past one page. A shorter letter is easier for the
            receiver to read.
          </p>
        )}

        {/* The viewer keeps its own size; a zoomed sheet scrolls inside it. */}
        <div
          ref={containerRef}
          className="letter-viewer max-h-[80vh] w-full overflow-auto"
        >
          {/* Scaling does not change layout size, so reserve the scaled size here. */}
          <div
            className="letter-frame mx-auto"
            style={{
              width: SHEET_WIDTH * scale,
              height: sheetHeight * scale,
              transition: zoomTransition,
            }}
          >
            <div
              ref={sheetRef}
              className="letter-sheet relative flex flex-col bg-white px-24 pt-[0.75in] pb-[0.5in] text-black shadow-lg"
              style={{
                width: SHEET_WIDTH,
                minHeight: SHEET_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                transition: zoomTransition
                  ? "transform 200ms ease-out"
                  : undefined,
              }}
            >
              {/* Letterhead */}
              {/* A div, not <header>: the team's print CSS hides every <header>. */}
              <div className="border-brand-primary/50 flex items-center gap-5 border-b pb-5">
                {/* Full-color logo. The navbar uses caritas_nav.png (white), which would be invisible on this page, so keep this file in public/. */}
                <Image
                  src="/caritas_logo.png"
                  alt="Caritas Manila logo"
                  width={84}
                  height={84}
                  className="shrink-0"
                  priority
                />
                <div>
                  <p className="text-brand-primary text-[28px] leading-tight font-bold tracking-tight">
                    CARITAS MANILA
                  </p>
                  <p className="mt-1.5 inline-block bg-black px-3 py-1 text-[13px] text-white">
                    Social Services and Development Ministry
                  </p>
                </div>
              </div>

              {/* Letter body */}
              <div className="flex-1 pt-6 text-[11pt] leading-[1.5]">
                {editing ? (
                  // Same text size as the preview; the negative margin cancels the
                  // padding so the text lines up with the preview.
                  <textarea
                    ref={textareaRef}
                    aria-label="Letter text"
                    rows={1}
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                    className="ring-brand-primary/30 focus:ring-brand-primary/60 -m-2 block w-[calc(100%+1rem)] resize-none overflow-hidden rounded-[4px] bg-transparent p-2 ring-1 outline-none focus:ring-2"
                  />
                ) : (
                  paragraphs.map((paragraph, index) => (
                    // whitespace-pre-line keeps single line breaks (like the address lines).
                    <p
                      key={index}
                      className={
                        index === 0
                          ? "whitespace-pre-line"
                          : "mt-3 whitespace-pre-line"
                      }
                    >
                      {renderMarkup(paragraph)}
                    </p>
                  ))
                )}
              </div>

              {/* Footer */}
              <footer className="mt-6 border-t border-gray-300 pt-3 text-center text-[9pt] leading-snug text-gray-500">
                {FOOTER_TEXT}
              </footer>

              {/* Marks where page 2 would start when the letter is too long. */}
              {runsPastOnePage && (
                <div
                  aria-hidden="true"
                  className="no-print border-icon-warning absolute right-0 left-0 border-t-2 border-dashed"
                  style={{ top: SHEET_HEIGHT }}
                >
                  <span className="text-text-warning absolute -top-3 right-3 bg-white px-2 text-xs">
                    Page 2 starts here
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
