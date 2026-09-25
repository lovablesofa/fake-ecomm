import Image from "next/image";
import type { ArtKind } from "@/lib/catalog";

type Palette = { fg: string; accent: string; light: string };

const SHAPES: Record<ArtKind, (p: Palette) => React.ReactNode> = {
  headphones: ({ fg, accent }) => (
    <>
      <path d="M50 112V96a50 50 0 0 1 100 0v16" fill="none" stroke={fg} strokeWidth="10" strokeLinecap="round" />
      <rect x="36" y="104" width="30" height="50" rx="12" fill={fg} />
      <rect x="134" y="104" width="30" height="50" rx="12" fill={fg} />
      <rect x="58" y="112" width="10" height="34" rx="5" fill={accent} />
      <rect x="132" y="112" width="10" height="34" rx="5" fill={accent} />
    </>
  ),
  watch: ({ fg, accent, light }) => (
    <>
      <rect x="80" y="28" width="40" height="144" rx="12" fill={accent} />
      <circle cx="100" cy="100" r="42" fill={fg} />
      <circle cx="100" cy="100" r="33" fill={light} />
      <path d="M100 100V78M100 100l14 8" stroke={fg} strokeWidth="4" strokeLinecap="round" />
      <rect x="140" y="93" width="9" height="14" rx="3" fill={fg} />
    </>
  ),
  sneaker: ({ fg, accent, light }) => (
    <>
      <path d="M28 138h144a8 8 0 0 1 0 18H36a8 8 0 0 1-8-8z" fill={accent} />
      <path d="M32 140c0-26 16-42 38-42h22c12 0 16-20 28-22l16-2c16 14 34 36 36 66z" fill={fg} />
      <path d="M100 100l10 14M112 94l10 14M124 90l10 14" stroke={light} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  tote: ({ fg, accent }) => (
    <>
      <path d="M76 84V68a24 24 0 0 1 48 0v16" fill="none" stroke={fg} strokeWidth="8" />
      <path d="M48 82h104l10 84H38z" fill={fg} />
      <rect x="44" y="100" width="112" height="10" fill={accent} />
    </>
  ),
  lamp: ({ fg, accent }) => (
    <>
      <circle cx="100" cy="92" r="46" fill={accent} opacity="0.35" />
      <path d="M70 46h60l22 52H48z" fill={fg} />
      <rect x="96" y="98" width="8" height="58" fill={accent} />
      <ellipse cx="100" cy="160" rx="36" ry="9" fill={fg} />
    </>
  ),
  chair: ({ fg, accent }) => (
    <>
      <rect x="58" y="42" width="84" height="60" rx="18" fill={fg} />
      <rect x="50" y="102" width="100" height="22" rx="10" fill={fg} />
      <path d="M64 124l-8 42M136 124l8 42" stroke={accent} strokeWidth="8" strokeLinecap="round" />
    </>
  ),
  bottle: ({ fg, accent, light }) => (
    <>
      <rect x="84" y="32" width="32" height="24" rx="5" fill={fg} />
      <rect x="89" y="54" width="22" height="18" fill={accent} />
      <rect x="70" y="70" width="60" height="98" rx="14" fill={fg} />
      <rect x="82" y="100" width="36" height="38" rx="4" fill={light} />
      <rect x="90" y="112" width="20" height="4" rx="2" fill={accent} />
    </>
  ),
  speaker: ({ fg, accent }) => (
    <>
      <rect x="60" y="34" width="80" height="132" rx="20" fill={fg} />
      <circle cx="100" cy="120" r="28" fill={accent} />
      <circle cx="100" cy="120" r="11" fill={fg} />
      <circle cx="100" cy="68" r="12" fill={accent} />
    </>
  ),
  mug: ({ fg, accent }) => (
    <>
      <path d="M80 50c0-10 10-10 10-20M100 50c0-10 10-10 10-20" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M130 86h10a18 18 0 0 1 0 36h-10" fill="none" stroke={fg} strokeWidth="10" />
      <rect x="54" y="64" width="78" height="96" rx="12" fill={fg} />
      <rect x="54" y="92" width="78" height="10" fill={accent} />
    </>
  ),
  plant: ({ fg, accent }) => (
    <>
      <ellipse cx="80" cy="80" rx="18" ry="34" transform="rotate(-30 80 80)" fill={fg} />
      <ellipse cx="120" cy="74" rx="18" ry="36" transform="rotate(28 120 74)" fill={fg} />
      <ellipse cx="100" cy="60" rx="16" ry="38" fill={fg} />
      <path d="M100 96v28" stroke={fg} strokeWidth="6" />
      <path d="M64 120h72l-10 46H74z" fill={accent} />
    </>
  ),
  sunglasses: ({ fg, accent }) => (
    <>
      <path d="M30 88l-10-18M170 88l10-18" stroke={fg} strokeWidth="6" strokeLinecap="round" />
      <rect x="30" y="84" width="60" height="44" rx="20" fill={fg} />
      <rect x="110" y="84" width="60" height="44" rx="20" fill={fg} />
      <path d="M90 96q10-8 20 0" stroke={fg} strokeWidth="6" fill="none" />
      <path d="M42 96l14-6M122 96l14-6" stroke={accent} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  candle: ({ fg, accent }) => (
    <>
      <path d="M100 48c10 12 8 24 0 28-8-4-10-16 0-28z" fill={accent} />
      <path d="M100 76v12" stroke={fg} strokeWidth="3" />
      <rect x="60" y="86" width="80" height="80" rx="10" fill={fg} />
      <ellipse cx="100" cy="90" rx="36" ry="7" fill={accent} opacity="0.7" />
    </>
  ),
  backpack: ({ fg, accent }) => (
    <>
      <path d="M86 52V42a14 14 0 0 1 28 0v10" fill="none" stroke={fg} strokeWidth="7" />
      <rect x="54" y="52" width="92" height="118" rx="28" fill={fg} />
      <rect x="72" y="114" width="56" height="40" rx="10" fill={accent} />
      <rect x="92" y="122" width="16" height="5" rx="2.5" fill={fg} />
    </>
  ),
  camera: ({ fg, accent, light }) => (
    <>
      <rect x="62" y="54" width="36" height="22" rx="5" fill={fg} />
      <rect x="32" y="70" width="136" height="88" rx="14" fill={fg} />
      <circle cx="100" cy="114" r="32" fill={accent} />
      <circle cx="100" cy="114" r="20" fill={fg} />
      <circle cx="94" cy="108" r="6" fill={light} />
      <circle cx="148" cy="86" r="5" fill={accent} />
    </>
  ),
  keyboard: ({ fg, light, accent }) => (
    <>
      <rect x="22" y="70" width="156" height="66" rx="10" fill={fg} />
      {[0, 1, 2].flatMap((row) =>
        Array.from({ length: 9 }, (_, i) => (
          <rect key={`${row}-${i}`} x={32 + i * 15.5} y={80 + row * 16} width="12" height="12" rx="2.5" fill={row === 0 && i === 0 ? accent : light} />
        )),
      )}
    </>
  ),
  jacket: ({ fg, accent }) => (
    <>
      <path d="M70 44l30 14 30-14 36 26-16 38-10-6v70H60v-70l-10 6-16-38z" fill={fg} />
      <path d="M100 58v110" stroke={accent} strokeWidth="4" />
      <path d="M70 44l30 22 30-22" fill="none" stroke={accent} strokeWidth="4" />
    </>
  ),
};

type Props = {
  kind: ArtKind;
  hue: number;
  className?: string;
  // Real photo; when set it replaces the illustration.
  image?: string;
  alt?: string;
  // Rendered width hint for next/image, e.g. "(max-width: 1024px) 50vw, 25vw".
  sizes?: string;
};

export function ProductArt({ kind, hue, className = "", image, alt = "", sizes = "50vw" }: Props) {
  if (image) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ background: `hsl(${hue} 42% 91%)` }}>
        <Image src={image} alt={alt} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }
  const palette = {
    fg: `hsl(${hue} 32% 26%)`,
    accent: `hsl(${(hue + 28) % 360} 60% 62%)`,
    light: `hsl(${hue} 40% 96%)`,
  };
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ background: `hsl(${hue} 42% 91%)` }}>
      <svg viewBox="0 0 200 200" className="h-3/4 w-3/4" aria-hidden="true">
        <ellipse cx="100" cy="176" rx="62" ry="6" fill={palette.fg} opacity="0.08" />
        {SHAPES[kind](palette)}
      </svg>
    </div>
  );
}
