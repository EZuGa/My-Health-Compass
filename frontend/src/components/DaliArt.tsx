// Rusudan Petviashvili-inspired figures — no background frames, just sculpted
// 3D shapes with rich jewel-tone gradients, soft shadows, and flowing motion.

type Props = { className?: string };

const RP_INK = "#15213a";

function RPDefs() {
  return (
    <defs>
      {/* yellow-free palette: rose, plum, sage, teal, indigo, blush */}
      <radialGradient id="rp3-ochre" cx="32%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#f5d4d4" />
        <stop offset="45%" stopColor="#c97a8e" />
        <stop offset="100%" stopColor="#3a1828" />
      </radialGradient>
      <radialGradient id="rp3-coral" cx="32%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#ffd9d9" />
        <stop offset="45%" stopColor="#ee5a78" />
        <stop offset="100%" stopColor="#5a0e1e" />
      </radialGradient>
      <radialGradient id="rp3-teal" cx="32%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#cdeeea" />
        <stop offset="45%" stopColor="#5fb5af" />
        <stop offset="100%" stopColor="#0e3a3d" />
      </radialGradient>
      <radialGradient id="rp3-rust" cx="32%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#f0b8b0" />
        <stop offset="45%" stopColor="#b04848" />
        <stop offset="100%" stopColor="#2a0a10" />
      </radialGradient>
      <radialGradient id="rp3-indigo" cx="32%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#6a7cbf" />
        <stop offset="45%" stopColor="#243a78" />
        <stop offset="100%" stopColor="#070d22" />
      </radialGradient>
      <radialGradient id="rp3-cream" cx="32%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#f3e4ea" />
        <stop offset="55%" stopColor="#b8a0b8" />
        <stop offset="100%" stopColor="#3a2840" />
      </radialGradient>
      <radialGradient id="rp3-skin" cx="32%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#fde0d4" />
        <stop offset="55%" stopColor="#d49888" />
        <stop offset="100%" stopColor="#5a2828" />
      </radialGradient>
      {/* impressionist soft shadow — heavy gaussian blur */}
      <filter id="rp3-shadow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="3.2" />
      </filter>
    </defs>
  );
}

const RP_STYLES = `
  @keyframes rp-drift   { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-2px) rotate(1.5deg)} }
  @keyframes rp-sway    { 0%,100%{transform:rotate(-12deg)} 50%{transform:rotate(12deg)} }
  @keyframes rp-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes rp-spin    { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes rp-blink   { 0%,94%,100%{transform:scaleY(1)} 97%{transform:scaleY(.08)} }
`;

export function DaliHeart({ className }: Props) {
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden>
      <RPDefs />
      <style>{RP_STYLES + `.rph{animation:rp-breathe 1.2s ease-in-out infinite;transform-origin:40px 32px;transform-box:fill-box}`}</style>
      <defs>
        <radialGradient id="rp3-heart-pink" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffe6ec" />
          <stop offset="35%" stopColor="#ff9fb4" />
          <stop offset="70%" stopColor="#ef5577" />
          <stop offset="100%" stopColor="#8a2042" />
        </radialGradient>
        <radialGradient id="rp3-heart-cloud" cx="60%" cy="70%" r="70%">
          <stop offset="0%" stopColor="#ffc4d2" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ff8fa8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ff8fa8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="40" cy="54" rx="20" ry="3" fill="#c25070" opacity="0.35" filter="url(#rp3-shadow)" />
      <g className="rph">
        {/* soft impressionist halo */}
        <path d="M40 20 C 30 4, 10 8, 12 24 C 14 38, 40 54, 40 54 C 40 54, 66 38, 68 24 C 70 8, 50 4, 40 20 Z"
              fill="#ff8aa6" opacity="0.45" filter="url(#rp3-shadow)" transform="translate(2 3)" />
        {/* heart body — no outline */}
        <path d="M40 20 C 30 4, 10 8, 12 24 C 14 38, 40 54, 40 54 C 40 54, 66 38, 68 24 C 70 8, 50 4, 40 20 Z"
              fill="url(#rp3-heart-pink)" />
        {/* cloudy blended overlay for soft pinkish-red mix */}
        <path d="M40 20 C 30 4, 10 8, 12 24 C 14 38, 40 54, 40 54 C 40 54, 66 38, 68 24 C 70 8, 50 4, 40 20 Z"
              fill="url(#rp3-heart-cloud)" />
        {/* painterly shading dabs instead of hard lines */}
        <path d="M22 26 Q 30 36 30 46" fill="none" stroke="#c44066" strokeWidth="3" opacity="0.35" filter="url(#rp3-shadow)" />
        <path d="M58 26 Q 50 36 50 46" fill="none" stroke="#c44066" strokeWidth="3" opacity="0.35" filter="url(#rp3-shadow)" />
        <ellipse cx="30" cy="20" rx="8" ry="3.5" fill="#fff" opacity="0.55" filter="url(#rp3-shadow)" />
        <ellipse cx="26" cy="18" rx="2.5" ry="1.2" fill="#fff" opacity="0.85" />
      </g>
    </svg>
  );
}

export function DaliMetabolic({ className }: Props) {
  // Da Vinci Vitruvian-man study: sepia ink anatomy with hatching, inscribed in
  // circle + square. Arms ghost in pink / violet / watery-green afterimages,
  // curls blown by wind. No background frame.
  const INK = "#5a3418";
  const INK2 = "#7a4a22";
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden>
      <defs>
        <radialGradient id="vm-skin" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f6e4ce" />
          <stop offset="70%" stopColor="#e6c79e" />
          <stop offset="100%" stopColor="#b88a55" />
        </radialGradient>
        <pattern id="vm-hatch" patternUnits="userSpaceOnUse" width="1.4" height="1.4" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="1.4" stroke={INK} strokeWidth="0.15" opacity="0.5" />
        </pattern>
      </defs>
      <style>{`
        @keyframes vm-armA { 0%,100%{opacity:.5;transform:rotate(-3deg)} 50%{opacity:.85;transform:rotate(3deg)} }
        @keyframes vm-armB { 0%,100%{opacity:.8;transform:rotate(3deg)} 50%{opacity:.35;transform:rotate(-4deg)} }
        @keyframes vm-legA { 0%,100%{opacity:.55;transform:rotate(-2deg)} 50%{opacity:.95;transform:rotate(2deg)} }
        @keyframes vm-legB { 0%,100%{opacity:.9;transform:rotate(2deg)} 50%{opacity:.4;transform:rotate(-2deg)} }
        @keyframes vm-curl { 0%,100%{transform:translateX(0) rotate(0)} 50%{transform:translateX(-0.8px) rotate(-5deg)} }
        @keyframes vm-curl2{ 0%,100%{transform:translateX(0) rotate(0)} 50%{transform:translateX(-1.4px) rotate(-8deg)} }
        @keyframes vm-breath{ 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.015)} }
        .vm-armsA{animation:vm-armA 3.4s ease-in-out infinite;transform-origin:40px 24px;transform-box:fill-box}
        .vm-armsB{animation:vm-armB 3.4s ease-in-out infinite;transform-origin:40px 24px;transform-box:fill-box}
        .vm-legsA{animation:vm-legA 3.6s ease-in-out infinite;transform-origin:40px 36px;transform-box:fill-box}
        .vm-legsB{animation:vm-legB 3.6s ease-in-out infinite;transform-origin:40px 36px;transform-box:fill-box}
        .vm-h1{animation:vm-curl 2.6s ease-in-out infinite;transform-origin:40px 13px;transform-box:fill-box}
        .vm-h2{animation:vm-curl2 3s ease-in-out .15s infinite;transform-origin:40px 13px;transform-box:fill-box}
        .vm-body{animation:vm-breath 3.4s ease-in-out infinite;transform-origin:40px 36px;transform-box:fill-box}
      `}</style>

      {/* inscribed circle + square (da Vinci geometry) */}
      <rect x="14" y="9" width="52" height="46" fill="none" stroke={INK2} strokeWidth="0.35" opacity="0.55" />
      <circle cx="40" cy="32" r="25" fill="none" stroke={INK} strokeWidth="0.5" opacity="0.75" />
      <line x1="40" y1="7" x2="40" y2="57" stroke={INK2} strokeWidth="0.2" opacity="0.35" strokeDasharray="0.6 0.8" />
      <line x1="15" y1="32" x2="65" y2="32" stroke={INK2} strokeWidth="0.2" opacity="0.35" strokeDasharray="0.6 0.8" />

      {/* colored ghost arms — watery washes */}
      <g className="vm-armsA" stroke="#ef6f95" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" fill="none">
        <path d="M40 24 Q 30 24 20 24" />
        <path d="M40 24 Q 50 24 60 24" />
      </g>
      <g className="vm-armsB" stroke="#9b6bc8" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" fill="none">
        <path d="M40 25 Q 30 22 18 18" />
        <path d="M40 25 Q 50 22 62 18" />
      </g>
      <g className="vm-armsA" stroke="#7fc7a7" strokeWidth="2" strokeLinecap="round" opacity="0.5" fill="none" style={{ animationDelay: '0.5s' }}>
        <path d="M40 26 Q 30 28 20 31" />
        <path d="M40 26 Q 50 28 60 31" />
      </g>

      {/* colored ghost legs — same watery palette */}
      <g className="vm-legsA" stroke="#ef6f95" strokeWidth="2.6" strokeLinecap="round" opacity="0.5" fill="none">
        <path d="M40 36 Q 35 46 30 56" />
        <path d="M40 36 Q 45 46 50 56" />
      </g>
      <g className="vm-legsB" stroke="#9b6bc8" strokeWidth="2.3" strokeLinecap="round" opacity="0.45" fill="none">
        <path d="M40 36 Q 33 47 25 56" />
        <path d="M40 36 Q 47 47 55 56" />
      </g>
      <g className="vm-legsA" stroke="#7fc7a7" strokeWidth="2" strokeLinecap="round" opacity="0.45" fill="none" style={{ animationDelay: '0.5s' }}>
        <path d="M40 36 L 39 56" />
        <path d="M40 36 L 41 56" />
      </g>

      {/* ANATOMICAL FIGURE — da Vinci style ink */}
      <g className="vm-body">
        {/* LEGS — wide Vitruvian stance, fully drawn & animated */}
        <g className="vm-legsA">
          <path d="M38 36 Q 34 41 31 47 Q 28.5 52 28.8 55.5 L 32.6 55.5 Q 33 52 34.5 47 Q 37 41 40 37 Z"
                fill="url(#vm-skin)" stroke={INK} strokeWidth="0.55" />
          <path d="M38 36 Q 34 41 31 47 Q 28.5 52 28.8 55.5 L 32.6 55.5 Q 33 52 34.5 47 Q 37 41 40 37 Z"
                fill="url(#vm-hatch)" opacity="0.55" />
          <ellipse cx="33" cy="46.5" rx="1.2" ry="0.7" fill="none" stroke={INK} strokeWidth="0.35" />
          <path d="M30.5 50 Q 31.2 52 31 55" fill="none" stroke={INK} strokeWidth="0.3" opacity="0.7" />
          <ellipse cx="30.7" cy="56" rx="2.3" ry="0.85" fill="url(#vm-skin)" stroke={INK} strokeWidth="0.45" />

          <path d="M42 36 Q 46 41 49 47 Q 51.5 52 51.2 55.5 L 47.4 55.5 Q 47 52 45.5 47 Q 43 41 40 37 Z"
                fill="url(#vm-skin)" stroke={INK} strokeWidth="0.55" />
          <path d="M42 36 Q 46 41 49 47 Q 51.5 52 51.2 55.5 L 47.4 55.5 Q 47 52 45.5 47 Q 43 41 40 37 Z"
                fill="url(#vm-hatch)" opacity="0.55" />
          <ellipse cx="47" cy="46.5" rx="1.2" ry="0.7" fill="none" stroke={INK} strokeWidth="0.35" />
          <path d="M49.5 50 Q 48.8 52 49 55" fill="none" stroke={INK} strokeWidth="0.3" opacity="0.7" />
          <ellipse cx="49.3" cy="56" rx="2.3" ry="0.85" fill="url(#vm-skin)" stroke={INK} strokeWidth="0.45" />
        </g>

        {/* LEGS — together pose (second Vitruvian position), counter-animated */}
        <g className="vm-legsB">
          <path d="M38.6 36 Q 37.8 44 37.8 52 L 38 56 L 40 56 L 40 36 Z"
                fill="url(#vm-skin)" stroke={INK} strokeWidth="0.45" opacity="0.85" />
          <path d="M41.4 36 Q 42.2 44 42.2 52 L 42 56 L 40 56 L 40 36 Z"
                fill="url(#vm-skin)" stroke={INK} strokeWidth="0.45" opacity="0.85" />
          <ellipse cx="38.8" cy="46" rx="0.7" ry="0.5" fill="none" stroke={INK} strokeWidth="0.28" />
          <ellipse cx="41.2" cy="46" rx="0.7" ry="0.5" fill="none" stroke={INK} strokeWidth="0.28" />
          <ellipse cx="38.6" cy="56" rx="1.6" ry="0.7" fill="url(#vm-skin)" stroke={INK} strokeWidth="0.4" />
          <ellipse cx="41.4" cy="56" rx="1.6" ry="0.7" fill="url(#vm-skin)" stroke={INK} strokeWidth="0.4" />
        </g>


        {/* torso — pectorals, ribcage, abdomen */}
        <path d="M35 23 Q 33 30 35 36 Q 40 38 45 36 Q 47 30 45 23 Q 40 21 35 23 Z"
              fill="url(#vm-skin)" stroke={INK} strokeWidth="0.55" />
        {/* hatching on torso */}
        <path d="M35 23 Q 33 30 35 36 Q 40 38 45 36 Q 47 30 45 23 Q 40 21 35 23 Z"
              fill="url(#vm-hatch)" opacity="0.5" />
        {/* pectorals */}
        <path d="M36 24 Q 38.5 26 40 28" fill="none" stroke={INK} strokeWidth="0.4" />
        <path d="M44 24 Q 41.5 26 40 28" fill="none" stroke={INK} strokeWidth="0.4" />
        {/* sternum + abs */}
        <path d="M40 27 L 40 35" stroke={INK} strokeWidth="0.3" />
        <path d="M37.5 30 Q 40 30.5 42.5 30" fill="none" stroke={INK} strokeWidth="0.25" />
        <path d="M37.5 33 Q 40 33.5 42.5 33" fill="none" stroke={INK} strokeWidth="0.25" />
        {/* obliques */}
        <path d="M35 30 Q 36 33 36 36" fill="none" stroke={INK2} strokeWidth="0.25" opacity="0.7" />
        <path d="M45 30 Q 44 33 44 36" fill="none" stroke={INK2} strokeWidth="0.25" opacity="0.7" />

        {/* arms — primary T-pose with shoulder/elbow/forearm/hand */}
        <g className="vm-armsA">
          {/* left arm */}
          <path d="M35 23 Q 28 23.5 22 24 L 19 24.3" fill="none" stroke={INK} strokeWidth="0.55" />
          <path d="M35 24.5 Q 28 25 22 25.3 L 19 25.5" fill="none" stroke={INK} strokeWidth="0.4" opacity="0.7" />
          {/* shoulder bulge */}
          <path d="M34 22.5 Q 32 23 31 24.5" fill="none" stroke={INK} strokeWidth="0.35" />
          {/* elbow */}
          <circle cx="27" cy="24" r="0.5" fill="none" stroke={INK} strokeWidth="0.25" />
          {/* hand — fingers splayed */}
          <g stroke={INK} strokeWidth="0.3" fill="none" strokeLinecap="round">
            <path d="M19 24.3 L 16 23.5" />
            <path d="M19 24.3 L 15.5 24" />
            <path d="M19 24.3 L 15.5 24.6" />
            <path d="M19 24.3 L 16 25.2" />
            <path d="M19 24.5 L 17 25.6" />
          </g>
          {/* right arm */}
          <path d="M45 23 Q 52 23.5 58 24 L 61 24.3" fill="none" stroke={INK} strokeWidth="0.55" />
          <path d="M45 24.5 Q 52 25 58 25.3 L 61 25.5" fill="none" stroke={INK} strokeWidth="0.4" opacity="0.7" />
          <path d="M46 22.5 Q 48 23 49 24.5" fill="none" stroke={INK} strokeWidth="0.35" />
          <circle cx="53" cy="24" r="0.5" fill="none" stroke={INK} strokeWidth="0.25" />
          <g stroke={INK} strokeWidth="0.3" fill="none" strokeLinecap="round">
            <path d="M61 24.3 L 64 23.5" />
            <path d="M61 24.3 L 64.5 24" />
            <path d="M61 24.3 L 64.5 24.6" />
            <path d="M61 24.3 L 64 25.2" />
            <path d="M61 24.5 L 63 25.6" />
          </g>
        </g>

        {/* head — three-quarter face with sepia anatomy */}
        <path d="M37 13 Q 36 17 37 20 Q 38.5 22 40 22 Q 41.5 22 43 20 Q 44 17 43 13 Q 40 10.5 37 13 Z"
              fill="url(#vm-skin)" stroke={INK} strokeWidth="0.5" />
        <path d="M37 13 Q 36 17 37 20 Q 38.5 22 40 22 Q 41.5 22 43 20 Q 44 17 43 13"
              fill="url(#vm-hatch)" opacity="0.4" />
        {/* facial features */}
        <path d="M38 17 Q 38.3 17.2 38.6 17" fill="none" stroke={INK} strokeWidth="0.3" />
        <path d="M41.4 17 Q 41.7 17.2 42 17" fill="none" stroke={INK} strokeWidth="0.3" />
        <path d="M40 17.5 L 40 19" stroke={INK} strokeWidth="0.25" />
        <path d="M39.2 20 Q 40 20.4 40.8 20" fill="none" stroke={INK} strokeWidth="0.3" strokeLinecap="round" />
        {/* brow */}
        <path d="M37.5 16 Q 38.3 15.7 39 16" fill="none" stroke={INK} strokeWidth="0.3" />
        <path d="M41 16 Q 41.7 15.7 42.5 16" fill="none" stroke={INK} strokeWidth="0.3" />
        {/* neck */}
        <path d="M38.5 22 L 38.5 23.5" stroke={INK} strokeWidth="0.35" />
        <path d="M41.5 22 L 41.5 23.5" stroke={INK} strokeWidth="0.35" />
      </g>

      {/* wind-blown curls — da Vinci style ringlets */}
      <g className="vm-h1" fill="none" stroke={INK} strokeWidth="0.45" strokeLinecap="round">
        <path d="M36.5 13 Q 34 11 33 13 Q 32 14.5 33.5 15" />
        <path d="M37 11.5 Q 35 9.5 33 10.5 Q 32 12 33 13" />
        <path d="M43.5 13 Q 46 11 47 13 Q 48 14.5 46.5 15" />
        <path d="M43 11.5 Q 45 9.5 47 10.5 Q 48 12 47 13" />
        <path d="M39 10.5 Q 40 9 41 10.5" />
        <path d="M37.5 10.5 Q 38.5 8.5 40 9" />
        <path d="M42.5 10.5 Q 41.5 8.5 40 9" />
      </g>
      <g className="vm-h2" fill="none" stroke={INK2} strokeWidth="0.4" strokeLinecap="round" opacity="0.85">
        <path d="M35 14 Q 30 13 27 15 Q 25 17 26 18.5" />
        <path d="M45 14 Q 50 13 53 15 Q 55 17 54 18.5" />
        <path d="M34.5 12 Q 30 10 27 11" />
        <path d="M45.5 12 Q 50 10 53 11" />
      </g>

    </svg>
  );
}

export function DaliFitness({ className }: Props) {
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden>
      <RPDefs />
      <style>{RP_STYLES + `
        @keyframes rpf-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
        @keyframes rpf-step-a { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} }
        @keyframes rpf-step-b { 0%,100%{transform:rotate(22deg)} 50%{transform:rotate(-22deg)} }
        .rpf-body{animation:rpf-bob 1.1s ease-in-out infinite;transform-origin:40px 30px;transform-box:fill-box}
        .rpf-la{animation:rpf-step-a 1.1s ease-in-out infinite;transform-origin:40px 38px;transform-box:fill-box}
        .rpf-lb{animation:rpf-step-b 1.1s ease-in-out infinite;transform-origin:40px 38px;transform-box:fill-box}
        .rpf-aa{animation:rpf-step-b 1.1s ease-in-out infinite;transform-origin:46px 24px;transform-box:fill-box}
        .rpf-ab{animation:rpf-step-a 1.1s ease-in-out infinite;transform-origin:34px 24px;transform-box:fill-box}
      `}</style>
      <ellipse cx="40" cy="56" rx="16" ry="1.6" fill="#000" opacity="0.3" filter="url(#rp3-shadow)" />
      <g className="rpf-body">
        <g className="rpf-lb">
          <path d="M39 38 Q 37 46 36 54 Q 38 55.5 40 54 Q 40.5 46 40.5 38 Z" fill="url(#rp3-teal)" stroke={RP_INK} strokeWidth="0.7" />
        </g>
        <g className="rpf-la">
          <path d="M40 38 Q 42 46 44 54 Q 42 55.5 40 54 Q 39.5 46 39.5 38 Z" fill="url(#rp3-rust)" stroke={RP_INK} strokeWidth="0.7" />
        </g>
        {/* slim torso */}
        <path d="M37 22 Q 40 19 43 22 Q 44 30 42.5 38 Q 40 39.5 37.5 38 Q 36 30 37 22 Z" fill="url(#rp3-ochre)" stroke={RP_INK} strokeWidth="0.9" />
        <path d="M37.5 26 Q 40 25 42.5 26" fill="none" stroke="#5a2a08" strokeWidth="0.5" />
        <path d="M37.5 32 Q 40 33 42.5 32" fill="none" stroke="#5a2a08" strokeWidth="0.5" />
        <g className="rpf-ab">
          <path d="M37 24 Q 32 30 30 38 Q 32 39 33 38 Q 35 30 38 25 Z" fill="url(#rp3-coral)" stroke={RP_INK} strokeWidth="0.6" />
        </g>
        <g className="rpf-aa">
          <path d="M43 24 Q 48 30 50 38 Q 48 39 47 38 Q 45 30 42 25 Z" fill="url(#rp3-coral)" stroke={RP_INK} strokeWidth="0.6" />
        </g>
        {/* slim head */}
        <path d="M37 9 Q 44 7 45 14 L 46.5 18 L 45 21 L 46 24 L 43 25.5 Q 38.5 24.5 37 21 Q 34 14 37 9 Z" fill="url(#rp3-skin)" stroke={RP_INK} strokeWidth="0.9" />
        <circle cx="42" cy="15" r="0.9" fill={RP_INK} />
        <path d="M40 13 Q 42 12 44 13" fill="none" stroke={RP_INK} strokeWidth="0.6" />
        <path d="M40 20 Q 42.5 19 44 20" fill="none" stroke="#7a2418" strokeWidth="0.6" />
        <path d="M35 9 Q 41 4 47 11" fill="none" stroke="#8a4a10" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

export function DaliSleep({ className }: Props) {
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden>
      <RPDefs />
      <defs>
        <radialGradient id="rps-gold" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fff4cc" />
          <stop offset="45%" stopColor="#f5c451" />
          <stop offset="100%" stopColor="#a86b1a" />
        </radialGradient>
        <radialGradient id="rps-sun-sphere" cx="32%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="20%" stopColor="#ffe9a3" />
          <stop offset="55%" stopColor="#ff9a2a" />
          <stop offset="85%" stopColor="#c4521a" />
          <stop offset="100%" stopColor="#5a1e08" />
        </radialGradient>
        <radialGradient id="rps-corona" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd76a" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#ff8a2a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff8a2a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rps-moon-pp" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffe1f0" />
          <stop offset="50%" stopColor="#d089c4" />
          <stop offset="100%" stopColor="#5a2a6a" />
        </radialGradient>
        <radialGradient id="rps-star" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="40%" stopColor="#ffd9f0" />
          <stop offset="100%" stopColor="#c68fe0" />
        </radialGradient>
      </defs>
      <style>{RP_STYLES + `
        .rps-rays{animation:rp-spin 40s linear infinite;transform-origin:22px 30px;transform-box:fill-box}
        .rps-corona{animation:rp-breathe 4s ease-in-out infinite;transform-origin:22px 30px;transform-box:fill-box}
        .rps-moon{animation:rp-drift 5s ease-in-out infinite;transform-origin:56px 30px;transform-box:fill-box}
        @keyframes rps-twinkle { 0%,100%{opacity:.3;transform:scale(.7)} 50%{opacity:1;transform:scale(1.15)} }
        .rps-s1{animation:rps-twinkle 1.8s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
        .rps-s2{animation:rps-twinkle 2.3s ease-in-out .4s infinite;transform-origin:center;transform-box:fill-box}
        .rps-s3{animation:rps-twinkle 1.5s ease-in-out .8s infinite;transform-origin:center;transform-box:fill-box}
        .rps-s4{animation:rps-twinkle 2.6s ease-in-out .2s infinite;transform-origin:center;transform-box:fill-box}
      `}</style>
      <ellipse cx="22" cy="50" rx="11" ry="1.6" fill="#000" opacity="0.25" filter="url(#rp3-shadow)" />
      <ellipse cx="56" cy="50" rx="11" ry="1.6" fill="#000" opacity="0.25" filter="url(#rp3-shadow)" />
      {/* 3D realistic sun: corona glow + rotating rays + sphere with limb darkening */}
      <g className="rps-corona">
        <circle cx="22" cy="30" r="16" fill="url(#rps-corona)" />
      </g>
      <g className="rps-rays" opacity="0.85">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x="21.4" y="10" width="1.2" height="6" rx="0.6"
                fill="url(#rps-gold)"
                transform={`rotate(${i * 30} 22 30)`} />
        ))}
      </g>
      <g>
        {/* sun sphere */}
        <circle cx="22" cy="30" r="9.5" fill="url(#rps-sun-sphere)" />
        {/* surface mottling */}
        <ellipse cx="20" cy="32" rx="3" ry="1.2" fill="#a83a10" opacity="0.25" />
        <ellipse cx="25" cy="29" rx="1.8" ry="0.8" fill="#a83a10" opacity="0.2" />
        <ellipse cx="23" cy="34" rx="2" ry="0.7" fill="#a83a10" opacity="0.18" />
        {/* limb darkening rim */}
        <circle cx="22" cy="30" r="9.5" fill="none" stroke="#5a1e08" strokeWidth="0.6" opacity="0.5" />
        {/* specular highlight */}
        <ellipse cx="18.5" cy="26.5" rx="3.2" ry="1.6" fill="#fff" opacity="0.55" />
        <ellipse cx="17.5" cy="25.5" rx="1" ry="0.5" fill="#fff" opacity="0.9" />
      </g>
      <g className="rps-moon">
        <path d="M52 16 A 14 14 0 1 0 52 44 A 11 11 0 1 1 58 26 A 11 11 0 0 1 52 16 Z" fill="url(#rps-moon-pp)" />
        <path d="M54 20 Q 60 30 54 40" fill="none" stroke="#9a5fb0" strokeWidth="1.2" opacity="0.55" />
        <path d="M50 28 Q 53 27 55 29" fill="none" stroke="#4a1a55" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M49 25 Q 53 23.5 56 25" fill="none" stroke="#4a1a55" strokeWidth="0.7" />
        <path d="M51 33 Q 53 32 55 33 Q 53 34 51 33 Z" fill="#d96aa0" />
        <ellipse cx="46" cy="22" rx="3" ry="1.6" fill="#fff" opacity="0.45" />
      </g>
      <g className="rps-s1"><path d="M10 10 L 11 13 L 14 14 L 11 15 L 10 18 L 9 15 L 6 14 L 9 13 Z" fill="url(#rps-star)" /></g>
      <g className="rps-s2"><path d="M70 12 L 70.8 14 L 73 14.6 L 70.8 15.2 L 70 17 L 69.2 15.2 L 67 14.6 L 69.2 14 Z" fill="url(#rps-gold)" /></g>
      <g className="rps-s3"><circle cx="40" cy="8" r="1.2" fill="#ffe9b3" /></g>
      <g className="rps-s4"><path d="M38 46 L 38.6 47.4 L 40 48 L 38.6 48.6 L 38 50 L 37.4 48.6 L 36 48 L 37.4 47.4 Z" fill="url(#rps-star)" /></g>
      <g className="rps-s1"><circle cx="72" cy="44" r="1" fill="#f5c451" /></g>
      <g className="rps-s2"><circle cx="6" cy="42" r="0.9" fill="#d089c4" /></g>
    </svg>
  );
}

export function DaliMind({ className }: Props) {
  // Mind & well-being: serene face with a bouquet blooming from the head,
  // a tilting watering can pouring a stream that nurtures the flowers.
  // Palette echoes the rest of the set — rose/coral/teal/ochre/plum on cream.
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden>
      <RPDefs />
      <style>{RP_STYLES + `
        @keyframes mw-pour { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(-16deg)} }
        @keyframes mw-drop { 0%{transform:translateY(-2px);opacity:0} 15%{opacity:.95} 100%{transform:translateY(18px);opacity:0} }
        @keyframes mw-wind1 { 0%,100%{transform:translateX(0) rotate(-4deg)} 50%{transform:translateX(0.6px) rotate(5deg)} }
        @keyframes mw-wind2 { 0%,100%{transform:translateX(0) rotate(3deg)} 50%{transform:translateX(-0.6px) rotate(-5deg)} }
        @keyframes mw-wind3 { 0%,100%{transform:translateX(-0.4px) rotate(-2deg)} 50%{transform:translateX(0.8px) rotate(6deg)} }
        @keyframes mw-breath{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-0.4px)} }
        @keyframes mw-plant { 0%,100%{transform:translate(0,0) rotate(0deg)} 25%{transform:translate(-1px,1px) rotate(-3deg)} 50%{transform:translate(0,-0.5px) rotate(2deg)} 75%{transform:translate(1px,0.5px) rotate(-1deg)} }
        .mw-arm{animation:mw-plant 4s ease-in-out infinite;transform-origin:46px 50px;transform-box:fill-box}
        .mw-can{animation:mw-pour 4s ease-in-out infinite;transform-origin:50px 14px;transform-box:fill-box}
        .mw-d1{animation:mw-drop 1.4s ease-in 0s infinite}
        .mw-d2{animation:mw-drop 1.4s ease-in .35s infinite}
        .mw-d3{animation:mw-drop 1.4s ease-in .7s infinite}
        .mw-d4{animation:mw-drop 1.4s ease-in 1.05s infinite}
        .mw-f1{animation:mw-wind1 3.2s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
        .mw-f2{animation:mw-wind2 3.8s ease-in-out .3s infinite;transform-origin:center;transform-box:fill-box}
        .mw-f3{animation:mw-wind3 3.4s ease-in-out .6s infinite;transform-origin:center;transform-box:fill-box}
        .mw-leaf1{animation:mw-wind1 3.4s ease-in-out infinite;transform-origin:bottom center;transform-box:fill-box}
        .mw-leaf2{animation:mw-wind2 3s ease-in-out infinite;transform-origin:bottom center;transform-box:fill-box}
        .mw-face{animation:mw-breath 3.6s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
      `}</style>


      {/* ELEGANT SHOULDERS + LONG NECK + FACE */}
      <g className="mw-face">
        {/* slender, narrow sloping shoulders — willowy silhouette */}
        <path d="M26 60 Q 30 54 35 50 Q 37 48.6 38.5 48 L 41.5 48 Q 43 48.6 45 50 Q 50 54 54 60 Z" fill="url(#rp3-skin)" stroke={RP_INK} strokeWidth="0.55" />
        {/* delicate collarbone */}
        <path d="M33 52 Q 40 50.8 47 52" fill="none" stroke={RP_INK} strokeWidth="0.3" opacity="0.55" />
        {/* thin dress straps for elegance */}
        <path d="M32 53 Q 33 56 33.5 60" fill="none" stroke={RP_INK} strokeWidth="0.3" opacity="0.5" />
        <path d="M48 53 Q 47 56 46.5 60" fill="none" stroke={RP_INK} strokeWidth="0.3" opacity="0.5" />
        {/* long swan neck */}
        <path d="M37 48 Q 36.5 42 37.5 38 L 42.5 38 Q 43.5 42 43 48 Z" fill="url(#rp3-skin)" stroke={RP_INK} strokeWidth="0.55" />
        {/* neck shading */}
        <path d="M37.5 40 Q 38 44 37.5 47" fill="none" stroke={RP_INK} strokeWidth="0.3" opacity="0.4" />
        {/* head — slightly higher, rosier */}
        <ellipse cx="40" cy="30" rx="9.5" ry="11" fill="url(#rp3-skin)" stroke={RP_INK} strokeWidth="0.6" />
        {/* healthy glow overlay */}
        <ellipse cx="40" cy="32" rx="8" ry="9" fill="#fbb6a0" opacity="0.15" />

        {/* BRIGHT happy eyes — open, sparkling */}
        <ellipse cx="36" cy="29" rx="1.4" ry="1" fill="#ffffff" stroke={RP_INK} strokeWidth="0.4" />
        <ellipse cx="44" cy="29" rx="1.4" ry="1" fill="#ffffff" stroke={RP_INK} strokeWidth="0.4" />
        <circle cx="36" cy="29.1" r="0.7" fill="#3a5a48" />
        <circle cx="44" cy="29.1" r="0.7" fill="#3a5a48" />
        <circle cx="36" cy="29" r="0.32" fill={RP_INK} />
        <circle cx="44" cy="29" r="0.32" fill={RP_INK} />
        <circle cx="36.25" cy="28.78" r="0.18" fill="#fff" />
        <circle cx="44.25" cy="28.78" r="0.18" fill="#fff" />
        {/* upper lash line — happy lift */}
        <path d="M34.4 28.4 Q 36 27.6 37.6 28.4" fill="none" stroke={RP_INK} strokeWidth="0.5" strokeLinecap="round" />
        <path d="M42.4 28.4 Q 44 27.6 45.6 28.4" fill="none" stroke={RP_INK} strokeWidth="0.5" strokeLinecap="round" />
        {/* soft brows — lifted, joyful */}
        <path d="M34 26.6 Q 36 25.8 38 26.6" fill="none" stroke="#5a2818" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M42 26.6 Q 44 25.8 46 26.6" fill="none" stroke="#5a2818" strokeWidth="0.5" strokeLinecap="round" />

        {/* small nose */}
        <path d="M40 31.5 Q 39.4 33.8 40 34.6 Q 40.6 33.8 40 31.5" fill="none" stroke={RP_INK} strokeWidth="0.35" strokeLinecap="round" />

        {/* WIDE open smile showing joy */}
        <path d="M35.5 37 Q 40 41.5 44.5 37 Q 40 39 35.5 37 Z" fill="#c44066" stroke={RP_INK} strokeWidth="0.55" strokeLinejoin="round" />
        <path d="M36.5 37.3 Q 40 38.6 43.5 37.3" fill="none" stroke="#f3e4ea" strokeWidth="0.45" strokeLinecap="round" opacity="0.85" />
        {/* dimples */}
        <circle cx="35.3" cy="36.8" r="0.3" fill={RP_INK} opacity="0.5" />
        <circle cx="44.7" cy="36.8" r="0.3" fill={RP_INK} opacity="0.5" />

        {/* rosy cheeks — healthy glow */}
        <ellipse cx="33" cy="34" rx="2" ry="1.4" fill="#ee5a78" opacity="0.55" />
        <ellipse cx="47" cy="34" rx="2" ry="1.4" fill="#ee5a78" opacity="0.55" />
        <ellipse cx="33" cy="34" rx="1" ry="0.6" fill="#ff8aa0" opacity="0.5" />
        <ellipse cx="47" cy="34" rx="1" ry="0.6" fill="#ff8aa0" opacity="0.5" />

        {/* tiny ear hints */}
        <path d="M30.4 31 Q 29.4 32.5 30.6 34" fill="none" stroke={RP_INK} strokeWidth="0.4" />
        <path d="M49.6 31 Q 50.6 32.5 49.4 34" fill="none" stroke={RP_INK} strokeWidth="0.4" />
      </g>

      {/* FLOWERS AS HAIR — bouquet crowning the head, no planter */}
      {/* base greenery framing the scalp like a hairline */}
      <g className="mw-leaf1">
        <path d="M30 22 Q 26 22 24 18 Q 28 20 32 22 Z" fill="url(#rp3-teal)" stroke={RP_INK} strokeWidth="0.35" />
      </g>
      <g className="mw-leaf2">
        <path d="M50 22 Q 54 22 56 18 Q 52 20 48 22 Z" fill="url(#rp3-teal)" stroke={RP_INK} strokeWidth="0.35" />
      </g>
      <g className="mw-leaf1">
        <path d="M34 20 Q 33 14 35 9 Q 36 14 36 20 Z" fill="#5fb5af" stroke={RP_INK} strokeWidth="0.3" opacity="0.9" />
      </g>
      <g className="mw-leaf2">
        <path d="M46 20 Q 47 14 45 9 Q 44 14 44 20 Z" fill="#5fb5af" stroke={RP_INK} strokeWidth="0.3" opacity="0.9" />
      </g>
      {/* side blooms cascading like hair tendrils */}
      <g className="mw-f2">
        <circle cx="29" cy="26" r="1.6" fill="#ef6f95" stroke={RP_INK} strokeWidth="0.25" />
        <circle cx="29" cy="26" r="0.5" fill="#c44066" />
      </g>
      <g className="mw-f3">
        <circle cx="51" cy="26" r="1.6" fill="#d089c4" stroke={RP_INK} strokeWidth="0.25" />
        <circle cx="51" cy="26" r="0.5" fill="#5a2840" />
      </g>
      <g className="mw-f1">
        <circle cx="28" cy="30" r="1.2" fill="url(#rp3-ochre)" stroke={RP_INK} strokeWidth="0.22" />
      </g>
      <g className="mw-f2">
        <circle cx="52" cy="30" r="1.2" fill="url(#rp3-cream)" stroke={RP_INK} strokeWidth="0.22" />
      </g>

      {/* big crown flowers replacing top of hair */}
      <g className="mw-f1">
        <g transform="translate(40 12)">
          {[0,45,90,135,180,225,270,315].map((a)=>(
            <ellipse key={a} cx="0" cy="-4" rx="2" ry="3.4" fill="url(#rp3-coral)" stroke={RP_INK} strokeWidth="0.3" transform={`rotate(${a})`} />
          ))}
          <circle r="1.8" fill="#f5c451" stroke={RP_INK} strokeWidth="0.3" />
        </g>
      </g>
      <g className="mw-f2">
        <g transform="translate(31 16)">
          {[0,60,120,180,240,300].map((a)=>(
            <ellipse key={a} cx="0" cy="-2.6" rx="1.5" ry="2.4" fill="#ef6f95" stroke={RP_INK} strokeWidth="0.25" transform={`rotate(${a})`} />
          ))}
          <circle r="1.2" fill="#c44066" />
        </g>
      </g>
      <g className="mw-f3">
        <g transform="translate(49 16)">
          {[0,45,90,135,180,225,270,315].map((a)=>(
            <ellipse key={a} cx="0" cy="-2.8" rx="1.2" ry="2.5" fill="#f3e4ea" stroke={RP_INK} strokeWidth="0.25" transform={`rotate(${a})`} />
          ))}
          <circle r="1.2" fill="#b5462e" />
        </g>
      </g>
      <g className="mw-f2">
        <circle cx="34" cy="8" r="1.5" fill="url(#rp3-ochre)" stroke={RP_INK} strokeWidth="0.25" />
        <circle cx="34" cy="8" r="0.55" fill="#5a2818" />
      </g>
      <g className="mw-f1">
        <circle cx="46" cy="8" r="1.5" fill="url(#rp3-cream)" stroke={RP_INK} strokeWidth="0.25" />
        <circle cx="46" cy="8" r="0.55" fill="#3a2840" />
      </g>
      {/* extra abundance — more blooms tucked through her crown */}
      <g className="mw-f3">
        <g transform="translate(40 5)">
          {[0,60,120,180,240,300].map((a)=>(
            <ellipse key={a} cx="0" cy="-2.2" rx="1.2" ry="2" fill="#ee5a78" stroke={RP_INK} strokeWidth="0.22" transform={`rotate(${a})`} />
          ))}
          <circle r="0.9" fill="#f5c451" />
        </g>
      </g>
      <g className="mw-f1">
        <g transform="translate(26 20)">
          {[0,72,144,216,288].map((a)=>(
            <ellipse key={a} cx="0" cy="-1.8" rx="1" ry="1.7" fill="url(#rp3-coral)" stroke={RP_INK} strokeWidth="0.22" transform={`rotate(${a})`} />
          ))}
          <circle r="0.7" fill="#b5462e" />
        </g>
      </g>
      <g className="mw-f2">
        <g transform="translate(54 20)">
          {[0,72,144,216,288].map((a)=>(
            <ellipse key={a} cx="0" cy="-1.8" rx="1" ry="1.7" fill="#f3e4ea" stroke={RP_INK} strokeWidth="0.22" transform={`rotate(${a})`} />
          ))}
          <circle r="0.7" fill="#c44066" />
        </g>
      </g>
      <g className="mw-f3"><circle cx="30" cy="14" r="0.9" fill="#d089c4" stroke={RP_INK} strokeWidth="0.2" /></g>
      <g className="mw-f1"><circle cx="50" cy="14" r="0.9" fill="url(#rp3-ochre)" stroke={RP_INK} strokeWidth="0.2" /></g>
      <g className="mw-f2"><circle cx="37" cy="4" r="0.8" fill="#ef6f95" stroke={RP_INK} strokeWidth="0.2" /></g>
      <g className="mw-f3"><circle cx="43" cy="4" r="0.8" fill="#f5c451" stroke={RP_INK} strokeWidth="0.2" /></g>
      {/* tiny buds peppered through */}
      <g fill="#c44066" opacity="0.8">
        <circle cx="32" cy="11" r="0.5" />
        <circle cx="48" cy="11" r="0.5" />
        <circle cx="40" cy="20" r="0.45" />
        <circle cx="36" cy="18" r="0.4" />
        <circle cx="44" cy="18" r="0.4" />
      </g>

      {/* CASCADING forehead flowers — drip down sides of face to brow level */}
      <g className="mw-f2">
        <circle cx="31" cy="23" r="1.1" fill="#ef6f95" stroke={RP_INK} strokeWidth="0.22" />
        <circle cx="31" cy="23" r="0.4" fill="#c44066" />
      </g>
      <g className="mw-f3">
        <circle cx="49" cy="23" r="1.1" fill="#d089c4" stroke={RP_INK} strokeWidth="0.22" />
        <circle cx="49" cy="23" r="0.4" fill="#5a2840" />
      </g>
      <g className="mw-f1">
        <circle cx="33" cy="26" r="0.9" fill="url(#rp3-coral)" stroke={RP_INK} strokeWidth="0.2" />
      </g>
      <g className="mw-f2">
        <circle cx="47" cy="26" r="0.9" fill="url(#rp3-cream)" stroke={RP_INK} strokeWidth="0.2" />
      </g>
      {/* tiny petals over the forehead, ending just above the eyebrows */}
      <g className="mw-f3">
        <ellipse cx="36" cy="25" rx="0.7" ry="1.1" fill="#ef6f95" stroke={RP_INK} strokeWidth="0.18" transform="rotate(-25 36 25)" />
      </g>
      <g className="mw-f1">
        <ellipse cx="44" cy="25" rx="0.7" ry="1.1" fill="url(#rp3-ochre)" stroke={RP_INK} strokeWidth="0.18" transform="rotate(25 44 25)" />
      </g>
      <g className="mw-f2">
        <circle cx="38" cy="25.5" r="0.55" fill="#f5c451" stroke={RP_INK} strokeWidth="0.15" />
      </g>
      <g className="mw-f3">
        <circle cx="42" cy="25.5" r="0.55" fill="#c44066" stroke={RP_INK} strokeWidth="0.15" />
      </g>
      <g className="mw-f1">
        <circle cx="40" cy="24.5" r="0.5" fill="#f3e4ea" stroke={RP_INK} strokeWidth="0.15" />
      </g>
      {/* dangling buds at temple */}
      <g fill="#ef6f95" stroke={RP_INK} strokeWidth="0.15" opacity="0.9">
        <circle cx="30" cy="27" r="0.4" />
        <circle cx="50" cy="27" r="0.4" />
        <circle cx="29" cy="25" r="0.35" />
        <circle cx="51" cy="25" r="0.35" />
      </g>

      {/* ARM + CAN move together as she plants/waters */}
      <g className="mw-arm">
        {/* upper arm — reaches HIGH up from shoulder */}
        <path d="M46 50 Q 60 32 66 14" fill="none" stroke="url(#rp3-skin)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M46 50 Q 60 32 66 14" fill="none" stroke={RP_INK} strokeWidth="0.4" opacity="0.7" strokeLinecap="round" />
        {/* forearm crossing high above the head */}
        <path d="M66 14 Q 60 6 52 6" fill="none" stroke="url(#rp3-skin)" strokeWidth="2" strokeLinecap="round" />
        <path d="M66 14 Q 60 6 52 6" fill="none" stroke={RP_INK} strokeWidth="0.35" opacity="0.7" strokeLinecap="round" />
        {/* elbow & hand */}
        <circle cx="66" cy="14" r="1.5" fill="url(#rp3-skin)" stroke={RP_INK} strokeWidth="0.4" />
        <ellipse cx="51.5" cy="5.8" rx="1.8" ry="1.4" fill="url(#rp3-skin)" stroke={RP_INK} strokeWidth="0.45" />
        {/* finger hints gripping handle */}
        <path d="M50 5 Q 49.4 4 50.2 3.4" fill="none" stroke={RP_INK} strokeWidth="0.35" strokeLinecap="round" />
        <path d="M51 4.6 Q 50.6 3.6 51.4 3" fill="none" stroke={RP_INK} strokeWidth="0.3" strokeLinecap="round" />

        {/* watering can — held HIGH above the crown, pouring down */}
        <g className="mw-can">
          <path d="M43 1 Q 43 8 45 10 L 54 10 Q 56 8 56 1 Z" fill="#9caf88" stroke={RP_INK} strokeWidth="0.6" />
          <path d="M43 1 Q 43 8 45 10 L 54 10 Q 56 8 56 1 Z" fill="#6b8e5a" opacity="0.35" />
          {/* handle her hand grips */}
          <path d="M44 0 Q 48 -2 52 0 Q 52 4 50 3" fill="none" stroke={RP_INK} strokeWidth="0.7" />
          {/* spout angled down toward crown */}
          <path d="M43 3 L 35 1 L 34 4 L 42 7 Z" fill="url(#rp3-cream)" stroke={RP_INK} strokeWidth="0.5" />
          <ellipse cx="34.5" cy="2.5" rx="1.4" ry="0.8" fill="#5a3a48" stroke={RP_INK} strokeWidth="0.35" transform="rotate(-20 34.5 2.5)" />
          <ellipse cx="46" cy="5" rx="1.2" ry="3" fill="#fff" opacity="0.3" />
          <circle cx="51" cy="7" r="0.4" fill={RP_INK} opacity="0.5" />
        </g>

        {/* WATER stream — long arc falling from high spout DOWN onto the flowers */}
        <path d="M34 4 Q 35 8 37 12 Q 39 15 40 18" fill="none" stroke="#9ed0db" strokeWidth="1.4" opacity="0.85" strokeLinecap="round" />
        <path d="M34 4 Q 35 8 37 12 Q 39 15 40 18" fill="none" stroke="#ffffff" strokeWidth="0.55" opacity="0.95" strokeLinecap="round" />

        {/* shiny falling droplets — teardrop shape with white sheen */}
        <g>
          <defs>
            <radialGradient id="mw-drop-grad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#d6f1f7" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#4f9cb0" stopOpacity="0.95" />
            </radialGradient>
          </defs>
          {[
            { c: 'mw-d1', x: 34.2, y: 5,    s: 1.0, d: '0s' },
            { c: 'mw-d2', x: 35.0, y: 8,    s: 1.2, d: '0s' },
            { c: 'mw-d3', x: 36.4, y: 11,   s: 1.1, d: '0s' },
            { c: 'mw-d4', x: 38.0, y: 14,   s: 1.3, d: '0s' },
            { c: 'mw-d1', x: 39.5, y: 17,   s: 1.0, d: '0.2s' },
            { c: 'mw-d2', x: 40.5, y: 20,   s: 0.9, d: '0.55s' },
          ].map((d, i) => (
            <g key={i} className={d.c} style={{ animationDelay: d.d }}>
              <g transform={`translate(${d.x} ${d.y}) scale(${d.s})`}>
                <path d="M0 -1.4 Q 0.95 0 0 1.4 Q -0.95 0 0 -1.4 Z" fill="url(#mw-drop-grad)" stroke="#3a6a78" strokeWidth="0.18" />
                <ellipse cx="-0.35" cy="-0.45" rx="0.32" ry="0.55" fill="#ffffff" opacity="0.9" />
                <circle cx="0.35" cy="0.55" r="0.18" fill="#ffffff" opacity="0.55" />
              </g>
            </g>
          ))}
        </g>
      </g>

      {/* splash sparkles where water lands on flowers */}
      <g>
        <ellipse cx="40" cy="18.2" rx="1.6" ry="0.5" fill="#cfeef5" opacity="0.7" />
        <g fill="url(#mw-drop-grad)" stroke="#3a6a78" strokeWidth="0.15">
          <circle cx="40" cy="18" r="0.7" opacity="0.95" />
          <circle cx="42" cy="19" r="0.5" opacity="0.9" />
          <circle cx="38" cy="19" r="0.5" opacity="0.9" />
          <circle cx="41" cy="20" r="0.4" opacity="0.85" />
          <circle cx="39" cy="20.5" r="0.4" opacity="0.85" />
        </g>
        {/* tiny upward sparkle bursts */}
        <g fill="#ffffff" opacity="0.95">
          <circle cx="39.2" cy="17.4" r="0.22" />
          <circle cx="41.2" cy="18.2" r="0.18" />
          <circle cx="40.4" cy="19.4" r="0.2" />
        </g>
      </g>


    </svg>
  );
}



export function DaliExposures({ className }: Props) {
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden>
      <RPDefs />
      <defs>
        <radialGradient id="rpe-corona" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f3a6b8" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#6a4a8a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6a4a8a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rpe-violet" cx="32%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#d8b6ff" />
          <stop offset="55%" stopColor="#8a4dd8" />
          <stop offset="100%" stopColor="#3a155a" />
        </radialGradient>
      </defs>
      <style>{RP_STYLES + `
        .rpe-rays{animation:rp-spin 40s linear infinite;transform-origin:40px 30px;transform-box:fill-box}
        .rpe-corona{animation:rp-breathe 4s ease-in-out infinite;transform-origin:40px 30px;transform-box:fill-box}
        .rpe-orb{animation:rp-drift 5s ease-in-out infinite;transform-origin:40px 30px;transform-box:fill-box}
        .rpe-iris{animation:rp-breathe 3s ease-in-out infinite;transform-origin:40px 30px;transform-box:fill-box}
        @keyframes rpe-twinkle { 0%,100%{opacity:.3;transform:scale(.7)} 50%{opacity:1;transform:scale(1.15)} }
        .rpe-s1{animation:rpe-twinkle 1.8s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
        .rpe-s2{animation:rpe-twinkle 2.3s ease-in-out .4s infinite;transform-origin:center;transform-box:fill-box}
        .rpe-s3{animation:rpe-twinkle 1.5s ease-in-out .8s infinite;transform-origin:center;transform-box:fill-box}
        .rpe-s4{animation:rpe-twinkle 2.6s ease-in-out .2s infinite;transform-origin:center;transform-box:fill-box}
      `}</style>
      <ellipse cx="40" cy="54" rx="22" ry="2.2" fill="#000" opacity="0.3" filter="url(#rp3-shadow)" />
      {/* breathing corona glow behind the orb */}
      <g className="rpe-corona">
        <circle cx="40" cy="30" r="30" fill="url(#rpe-corona)" />
      </g>
      {/* slow rotating ray spokes around the orb */}
      <g className="rpe-rays" opacity="0.85">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x="39.4" y="2" width="1.2" height="6" rx="0.6"
                fill="url(#rp3-coral)"
                transform={`rotate(${i * 30} 40 30)`} />
        ))}
      </g>
      {/* the orb itself — gently drifts instead of spinning */}
      <g className="rpe-orb">
        <circle cx="40" cy="30" r="24" fill="url(#rpe-violet)" stroke={RP_INK} strokeWidth="1" />
        <circle cx="40" cy="30" r="19" fill="url(#rp3-coral)" stroke={RP_INK} strokeWidth="0.7" />
        <circle cx="40" cy="30" r="13" fill="url(#rp3-teal)" stroke={RP_INK} strokeWidth="0.7" />
        <ellipse cx="40" cy="30" rx="24" ry="8" fill="none" stroke={RP_INK} strokeWidth="0.5" opacity="0.6" />
        <ellipse cx="40" cy="30" rx="8" ry="24" fill="none" stroke={RP_INK} strokeWidth="0.5" opacity="0.6" />
        <ellipse cx="30" cy="18" rx="6" ry="3" fill="#fff" opacity="0.35" />
      </g>
      <g className="rpe-iris">
        <path d="M28 30 Q 40 22 52 30 Q 40 38 28 30 Z" fill="url(#rp3-cream)" stroke={RP_INK} strokeWidth="1" />
        <circle cx="40" cy="30" r="4.5" fill="url(#rp3-teal)" stroke={RP_INK} strokeWidth="0.8" />
        <circle cx="40" cy="30" r="2" fill={RP_INK} />
        <circle cx="41" cy="29" r="0.7" fill="#fff" />
      </g>
      {/* twinkling sparks in the surrounding space */}
      <g className="rpe-s1"><circle cx="8" cy="10" r="1" fill="#f3a6b8" /></g>
      <g className="rpe-s2"><circle cx="72" cy="12" r="0.9" fill="url(#rp3-cream)" /></g>
      <g className="rpe-s3"><circle cx="6" cy="44" r="0.9" fill="url(#rp3-teal)" /></g>
      <g className="rpe-s4"><circle cx="74" cy="46" r="1" fill="url(#rp3-coral)" /></g>
      <g className="rpe-s2"><circle cx="40" cy="4" r="0.8" fill="#fff" opacity="0.85" /></g>
    </svg>
  );
}


export const DaliByBox: Record<string, (p: Props) => React.ReactElement> = {
  heart: DaliHeart,
  metabolic: DaliMetabolic,
  fitness: DaliFitness,
  sleep: DaliSleep,
  mind: DaliMind,
  exposures: DaliExposures,
};
