// Draws the share image: a 1080 × 1350 page from the paper notebook, always in the light theme.
import tokens from '../../styles/tokens.css?raw';
import { dayText, examLine, type ShareCard } from './summary';

const W = 1080;
const H = 1350;
const PAGE = 48;
const RULE = 64;
const LEFT = 168;
const RIGHT = W - 96;
const TICKS = 10;

const SERIF = "'Newsreader', Georgia, serif";
const SANS = "'Inter Variable', sans-serif";

function token(name: string): string {
  // The first definition of each colour in tokens.css is the light theme.
  const value = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]+)`).exec(tokens)?.[1];
  if (!value) throw new Error(`Missing colour token --${name}`);
  return value;
}

export function lightPalette() {
  return { paper: token('paper'), raised: token('paper-raised'), graphite: token('graphite'), soft: token('graphite-soft'), rule: token('rule'), strong: token('rule-strong'), ink: token('ink') };
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

export async function drawCard(card: ShareCard, day: string, daysLeft: number | null): Promise<Blob> {
  await loadFonts();
  const colors = lightPalette();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

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
  spaced(ctx, card.kind.toUpperCase(), LEFT, RULE * 3 - 16, 4);

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

  // Rows of pencil ticks, one rule apart.
  card.rows.forEach((row, i) => {
    const y = RULE * (11 + i) - 16;
    ctx.font = `400 36px ${SANS}`;
    ctx.fillStyle = colors.graphite;
    ctx.fillText(row.label, LEFT, y);
    ctx.textAlign = 'right';
    ctx.font = `500 36px ${SANS}`;
    ctx.fillText(row.value, RIGHT, y);
    ctx.textAlign = 'left';
    const filled = Math.round(row.share * TICKS);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let t = 0; t < TICKS; t++) {
      const x = LEFT + 340 + t * 26;
      ctx.strokeStyle = t < filled ? colors.ink : colors.strong;
      ctx.beginPath();
      ctx.moveTo(x, y - 2);
      ctx.lineTo(x + 7, y - 34);
      ctx.stroke();
    }
  });

  const line = examLine(daysLeft);
  if (line) {
    ctx.font = `italic 400 44px ${SERIF}`;
    ctx.fillStyle = colors.soft;
    ctx.fillText(line, LEFT, RULE * 19 - 16);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not draw the card'))), 'image/png');
  });
}
