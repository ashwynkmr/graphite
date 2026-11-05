// Draws the share image: a 1080 × 1350 page from the paper notebook, always in the light theme.
import tokens from '../../styles/tokens.css?raw';
import { dayText, examLine, type ReportCard, type ResultCard, type ShareCard } from './summary';

const W = 1080;
const H = 1350;
const PAGE = 48;
const RULE = 64;
const LEFT = 168;
const RIGHT = W - 96;
const RULER_X = LEFT + 330;
const RULER_W = RIGHT - 230 - RULER_X;
const RULER_H = 38;
const COLUMN_GAP = 44;
const ARROW_MIN = 76;

const SERIF = "'Newsreader', Georgia, serif";
const SANS = "'Inter Variable', sans-serif";

function token(name: string): string {
  // The first definition of each colour in tokens.css is the light theme.
  const value = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]+)`).exec(tokens)?.[1];
  if (!value) throw new Error(`Missing colour token --${name}`);
  return value;
}

export function lightPalette() {
  return { paper: token('paper'), raised: token('paper-raised'), graphite: token('graphite'), soft: token('graphite-soft'), rule: token('rule'), strong: token('rule-strong'), ink: token('ink'), sunk: token('paper-sunk') };
}

/** Canvas only uses a font that has already loaded, so each face on the card is asked for first. */
async function loadFonts(): Promise<void> {
  await Promise.all([`500 72px ${SERIF}`, `400 72px ${SERIF}`, `italic 400 44px ${SERIF}`, `400 36px ${SANS}`, `500 36px ${SANS}`].map((f) => document.fonts.load(f, 'gRAPHITE 0123456789')));
  await document.fonts.ready;
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number): number {
  let at = x;
  for (const ch of text) {
    ctx.fillText(ch, at, y);
    at += ctx.measureText(ch).width + gap;
  }
  return at;
}

type Colors = ReturnType<typeof lightPalette>;

function drawRuler(ctx: CanvasRenderingContext2D, colors: Colors, x: number, top: number, width: number, share: number): void {
  const end = x + width * share;
  ctx.fillStyle = colors.sunk;
  ctx.beginPath();
  ctx.roundRect(x, top, width, RULER_H, 4);
  ctx.fill();
  if (share > 0) {
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(x, top, width * share, RULER_H);
    ctx.globalAlpha = 1;
  }
  // A mark every 10%, and a longer one at 50%.
  ctx.fillStyle = colors.graphite;
  for (let t = 1; t < 10; t++) ctx.fillRect(x + (width * t) / 10 - 1, top, 2, t === 5 ? 20 : 11);
  ctx.strokeStyle = colors.strong;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, top, width, RULER_H, 4);
  ctx.stroke();
  if (share > 0) {
    ctx.fillStyle = colors.ink;
    ctx.fillRect(end - 2, top - 4, 4, RULER_H + 8);
  }
}

/** The paper every card is drawn on: ruled lines, a margin rule, the wordmark, date and card type. */
function drawPage(ctx: CanvasRenderingContext2D, colors: Colors, kind: string, day: string): void {
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, W, H);

  // The page, its ruled lines and the margin rule.
  ctx.beginPath();
  ctx.roundRect(PAGE, PAGE, W - PAGE * 2, H - PAGE * 2, 28);
  ctx.fillStyle = colors.raised;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = colors.rule;
  for (let y = RULE * 3; y < H - PAGE; y += RULE) ctx.fillRect(PAGE, y, W - PAGE * 2, 2);
  ctx.fillStyle = colors.ink;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(120, PAGE, 2, H - PAGE * 2);
  ctx.restore();
  ctx.strokeStyle = colors.strong;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textBaseline = 'alphabetic';

  // gRAPHITE: the same small g and spaced capitals as the Wordmark component.
  ctx.fillStyle = colors.graphite;
  ctx.font = `500 76px ${SERIF}`;
  ctx.fillText('g', LEFT, 116);
  const gWidth = ctx.measureText('g').width;
  ctx.font = `500 38px ${SERIF}`;
  spaced(ctx, 'RAPHITE', LEFT + gWidth, 116, 3);

  ctx.textAlign = 'right';
  ctx.font = `400 32px ${SANS}`;
  ctx.fillStyle = colors.soft;
  ctx.fillText(dayText(day), RIGHT, 116);
  ctx.textAlign = 'left';

  ctx.font = `500 30px ${SANS}`;
  spaced(ctx, kind.toUpperCase(), LEFT, RULE * 3 - 16, 4);
}

/** Shrinks a line to fit its column, for long topic names. */
function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, weight: number, size: number): void {
  ctx.font = `${weight} ${size}px ${SANS}`;
  const width = ctx.measureText(text).width;
  if (width > maxWidth) ctx.font = `${weight} ${Math.floor((size * maxWidth) / width)}px ${SANS}`;
  ctx.fillText(text, x, y);
}

function drawTick(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  const at = (v: number) => (v / 40) * size;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, size / 8);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + at(6), y + at(22));
  ctx.lineTo(x + at(16), y + at(33));
  ctx.lineTo(x + at(34), y + at(7));
  ctx.stroke();
}

/** A 0% to 100% line, with a jump arrow from the earlier score to this one, as on a maths worksheet. */
function drawNumberLine(ctx: CanvasRenderingContext2D, colors: Colors, x: number, y: number, width: number, now: number | null, then: number | null): void {
  const inset = 14;
  const at = (v: number) => x + inset + v * (width - inset * 2);
  ctx.strokeStyle = colors.soft;
  ctx.lineWidth = 3;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(at(0), y);
  ctx.lineTo(at(1), y);
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    ctx.moveTo(at(v), y - 10);
    ctx.lineTo(at(v), y + 10);
  }
  ctx.stroke();
  ctx.font = `400 26px ${SANS}`;
  ctx.fillStyle = colors.soft;
  ctx.fillText('0%', at(0) - 8, y + 44);
  ctx.textAlign = 'center';
  ctx.fillText('50%', at(0.5), y + 44);
  ctx.textAlign = 'right';
  ctx.fillText('100%', at(1) + 8, y + 44);
  ctx.textAlign = 'left';
  if (now === null) return;

  const end = at(now);
  if (then !== null && Math.round(then * 100) !== Math.round(now * 100)) {
    const start = at(then);
    ctx.beginPath();
    ctx.arc(start, y, 11, 0, Math.PI * 2);
    ctx.fillStyle = colors.raised;
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Close scores get a straight arrow above the dots, because an arc would be too small to read.
    const direction = now > then ? 1 : -1;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    let tipX: number;
    let tipY: number;
    let angle: number;
    if (Math.abs(end - start) < ARROW_MIN) {
      const middle = Math.min(at(1) - ARROW_MIN / 2, Math.max(at(0) + ARROW_MIN / 2, (start + end) / 2));
      tipX = middle + (direction * ARROW_MIN) / 2;
      tipY = y - 36;
      angle = direction > 0 ? 0 : Math.PI;
      ctx.moveTo(middle - (direction * ARROW_MIN) / 2, tipY);
      ctx.lineTo(tipX, tipY);
    } else {
      const peak = y - 66;
      const mid = (start + end) / 2;
      tipX = end;
      tipY = y - 24;
      ctx.moveTo(start, y - 18);
      ctx.quadraticCurveTo(mid, peak, tipX, tipY);
      angle = Math.atan2(tipY - peak, tipX - mid);
    }
    ctx.stroke();
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.moveTo(tipX + Math.cos(angle) * 12, tipY + Math.sin(angle) * 12);
    ctx.lineTo(tipX + Math.cos(angle + 2.5) * 20, tipY + Math.sin(angle + 2.5) * 20);
    ctx.lineTo(tipX + Math.cos(angle - 2.5) * 20, tipY + Math.sin(angle - 2.5) * 20);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(end, y, 13, 0, Math.PI * 2);
  ctx.fillStyle = colors.ink;
  ctx.fill();
}

function drawReport(ctx: CanvasRenderingContext2D, colors: Colors, card: ReportCard): void {
  // The countdown, and a tick for each day studied.
  const baseline = 306;
  ctx.fillStyle = colors.ink;
  if (card.daysLeft === 0 || card.daysLeft === null) {
    ctx.font = `400 96px ${SERIF}`;
    ctx.fillText(card.daysLeft === 0 ? 'GRE day' : 'GRE done', LEFT, baseline);
  } else {
    ctx.font = `400 130px ${SERIF}`;
    const days = String(card.daysLeft);
    ctx.fillText(days, LEFT, baseline);
    const width = ctx.measureText(days).width;
    ctx.font = `400 46px ${SERIF}`;
    ctx.fillStyle = colors.soft;
    ctx.fillText(card.daysLeft === 1 ? 'day to go' : 'days to go', LEFT + width + 16, baseline);
  }
  const step = 378 / card.calendar.length;
  const size = Math.min(44, step - 3);
  const calendarX = RIGHT - 378;
  card.calendar.forEach((d, i) => {
    const x = calendarX + step * i;
    drawTick(ctx, x + (step - size) / 2, 244 - size, size, d.studied ? colors.ink : colors.strong);
    ctx.font = `400 ${step < 40 ? 18 : 24}px ${SANS}`;
    ctx.fillStyle = colors.soft;
    ctx.textAlign = 'center';
    ctx.fillText(d.letter, x + step / 2, 274);
    ctx.textAlign = 'left';
  });
  ctx.font = `400 28px ${SANS}`;
  ctx.fillStyle = colors.graphite;
  ctx.textAlign = 'center';
  ctx.fillText(card.studied, calendarX + 189, 318);
  ctx.textAlign = 'left';

  // Quant and Verbal, in two columns whose rows line up.
  const columnWidth = (RIGHT - LEFT - COLUMN_GAP) / 2;
  const columns = [LEFT, LEFT + columnWidth + COLUMN_GAP];
  ['QUANT', 'VERBAL'].forEach((title, i) => {
    ctx.font = `500 32px ${SANS}`;
    ctx.fillStyle = colors.ink;
    spaced(ctx, title, columns[i]!, 420, 5);
    ctx.fillRect(columns[i]!, 436, columnWidth, 4);
  });
  const bigLine = 556;
  const subLine = 610;
  const figureLine = 684;
  const big = (text: string, x: number) => {
    ctx.font = `400 112px ${SERIF}`;
    ctx.fillStyle = colors.ink;
    ctx.fillText(text, x, bigLine);
  };
  const sub = (text: string, x: number) => {
    ctx.fillStyle = colors.soft;
    fitText(ctx, text, x, subLine, columnWidth, 400, 30);
  };
  big(card.quant.accuracy === null ? '—' : `${Math.round(card.quant.accuracy * 100)}%`, columns[0]!);
  sub(card.quant.line, columns[0]!);
  drawNumberLine(ctx, colors, columns[0]!, figureLine, columnWidth, card.quant.accuracy, card.quant.previous);
  big(card.verbal.seen.toLocaleString('en-US'), columns[1]!);
  sub(`of ${card.verbal.deck.toLocaleString('en-US')} words seen`, columns[1]!);
  drawRuler(ctx, colors, columns[1]!, figureLine - RULER_H / 2, columnWidth, card.verbal.deck ? Math.min(1, card.verbal.seen / card.verbal.deck) : 0);

  [card.quant.rows, card.verbal.rows].forEach((rows, c) => {
    rows.forEach((row, r) => {
      const y = 786 + r * 104;
      ctx.fillStyle = colors.soft;
      fitText(ctx, row.label, columns[c]!, y, columnWidth, 400, 28);
      ctx.fillStyle = colors.graphite;
      fitText(ctx, row.value, columns[c]!, y + 44, columnWidth, 500, 36);
    });
  });

  // The teacher's note, wrapped to the page.
  ctx.font = `italic 400 46px ${SERIF}`;
  ctx.fillStyle = colors.ink;
  let line = '';
  let noteLine = 1152;
  for (const word of `Teacher's note: ${card.note}`.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > RIGHT - LEFT && line) {
      ctx.fillText(line, LEFT, noteLine);
      noteLine += 58;
      line = word;
    } else {
      line = next;
    }
  }
  ctx.fillText(line, LEFT, noteLine);
}

function drawResult(ctx: CanvasRenderingContext2D, colors: Colors, card: ResultCard, daysLeft: number | null): void {
  // The score.
  const baseline = RULE * 7 - 16;
  ctx.font = `400 240px ${SERIF}`;
  ctx.fillStyle = colors.ink;
  const score = String(card.score.value);
  ctx.fillText(score, LEFT - 6, baseline);
  const scoreWidth = ctx.measureText(score).width;
  ctx.font = `400 64px ${SERIF}`;
  ctx.fillStyle = colors.soft;
  ctx.fillText(card.score.of, LEFT + scoreWidth + 20, baseline);

  // Three stats in columns.
  const column = (RIGHT - LEFT) / card.stats.length;
  card.stats.forEach((stat, i) => {
    const x = LEFT + column * i;
    ctx.font = `400 30px ${SANS}`;
    ctx.fillStyle = colors.soft;
    ctx.fillText(stat.label, x, RULE * 8 - 16);
    ctx.font = `500 48px ${SANS}`;
    ctx.fillStyle = colors.graphite;
    ctx.fillText(stat.value, x, RULE * 9 - 16);
  });

  // Rows of rulers, one rule apart: each is shaded up to the row's score, with a mark where it stops.
  card.rows.forEach((row, i) => {
    const y = RULE * (11 + i) - 16;
    ctx.font = `400 36px ${SANS}`;
    ctx.fillStyle = colors.graphite;
    ctx.fillText(row.label, LEFT, y);
    ctx.textAlign = 'right';
    if (row.count) {
      ctx.font = `400 32px ${SANS}`;
      ctx.fillStyle = colors.soft;
      ctx.fillText(row.count, RIGHT - 122, y);
    }
    ctx.font = `500 36px ${SANS}`;
    ctx.fillStyle = colors.graphite;
    ctx.fillText(`${Math.round(row.share * 100)}%`, RIGHT, y);
    ctx.textAlign = 'left';
    drawRuler(ctx, colors, RULER_X, y - 34, RULER_W, row.share);
  });

  const line = examLine(daysLeft);
  if (line) {
    ctx.font = `italic 400 44px ${SERIF}`;
    ctx.fillStyle = colors.soft;
    ctx.fillText(line, LEFT, RULE * 19 - 16);
  }
}

export async function drawCard(card: ShareCard, day: string, daysLeft: number | null): Promise<Blob> {
  await loadFonts();
  const colors = lightPalette();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  drawPage(ctx, colors, card.kind, day);
  if ('quant' in card) drawReport(ctx, colors, card);
  else drawResult(ctx, colors, card, daysLeft);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not draw the card'))), 'image/png');
  });
}
