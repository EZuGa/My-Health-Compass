// Sage-green rotating earth globe with faint real-continent contours,
// and a large signature "Z" drawn inside as one continuous stroke.

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <svg
        viewBox="0 0 112 112"
        className="h-[56px] w-auto"
        aria-label="Health Passport logo"
        role="img"
      >
        <style>{`
          @keyframes lm-draw {
            0%   { stroke-dashoffset: 520; }
            70%  { stroke-dashoffset: 0; }
            90%  { stroke-dashoffset: 0; opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0; }
          }
          .lm-stroke {
            stroke-dasharray: 520;
            stroke-dashoffset: 520;
            animation: lm-draw 4.5s ease-in-out infinite;
          }
          @keyframes lm-spin {
            from { transform: translateX(-200px); }
            to   { transform: translateX(0); }
          }
          .lm-spin { animation: lm-spin 24s linear infinite; }
        `}</style>

        <defs>
          <radialGradient id="lm-globe" cx="34%" cy="30%" r="78%">
            <stop offset="0%"   stopColor="#e8f0dc" />
            <stop offset="45%"  stopColor="#bcd0a6" />
            <stop offset="85%"  stopColor="#8aa476" />
            <stop offset="100%" stopColor="#5e7a4a" />
          </radialGradient>
          <radialGradient id="lm-shade" cx="70%" cy="78%" r="65%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#1f2d18" stopOpacity="0.35" />
          </radialGradient>
          <clipPath id="lm-clip">
            <circle cx="56" cy="56" r="52" />
          </clipPath>

          {/* Stylised continent silhouettes — repeated for seamless spin */}
          <symbol id="lm-continents" viewBox="0 0 200 96">
            {/* Americas */}
            <path d="M18,28 q6,-6 12,-3 q5,2 4,9 q6,1 7,8 q-3,6 -10,7 q-2,8 -8,9 q-3,7 -9,4 q-4,-5 -2,-12 q-6,-4 -3,-11 q3,-7 9,-11 z" />
            <path d="M30,62 q5,-2 9,1 q4,4 1,9 q-4,6 -9,4 q-5,-3 -4,-9 q1,-3 3,-5 z" />
            {/* Africa + Europe */}
            <path d="M92,22 q10,-4 18,2 q6,5 4,12 q8,2 7,10 q-3,7 -11,7 q-2,10 -11,12 q-9,2 -13,-6 q-7,-3 -7,-12 q0,-9 5,-15 q3,-6 8,-10 z" />
            <path d="M86,16 q6,-3 11,0 q3,3 -1,6 q-5,3 -10,1 q-3,-3 0,-7 z" />
            {/* Asia */}
            <path d="M132,18 q14,-4 24,3 q10,6 8,16 q10,3 6,13 q-6,8 -16,6 q-6,7 -16,4 q-10,-2 -12,-12 q-8,-4 -6,-14 q2,-10 12,-16 z" />
            {/* Australia */}
            <path d="M158,66 q8,-3 14,1 q5,4 2,9 q-6,6 -14,4 q-7,-3 -6,-9 q1,-3 4,-5 z" />
          </symbol>
        </defs>

        {/* Globe base */}
        <circle cx="56" cy="56" r="52" fill="url(#lm-globe)" />

        {/* Continents, very light, rotating */}
        <g clipPath="url(#lm-clip)" opacity="0.32">
          <g className="lm-spin">
            <use href="#lm-continents" x="0"   y="12" width="200" height="88" fill="#4a6438" />
            <use href="#lm-continents" x="200" y="12" width="200" height="88" fill="#4a6438" />
          </g>
        </g>

        {/* Subtle grid */}
        <g clipPath="url(#lm-clip)" opacity="0.18" stroke="#4f6b42" strokeWidth="0.4" fill="none">
          <line x1="4" y1="56" x2="108" y2="56" />
          <ellipse cx="56" cy="56" rx="52" ry="18" />
          <ellipse cx="56" cy="56" rx="52" ry="36" />
          <ellipse cx="56" cy="56" rx="16" ry="52" />
          <ellipse cx="56" cy="56" rx="36" ry="52" />
        </g>

        {/* Soft light highlight */}
        <ellipse cx="38" cy="32" rx="22" ry="12" fill="#ffffff" opacity="0.32" />
        <ellipse cx="34" cy="28" rx="10" ry="4"  fill="#ffffff" opacity="0.45" />

        {/* Shadow on lower-right for spherical depth */}
        <circle cx="56" cy="56" r="52" fill="url(#lm-shade)" />

        {/* Rim */}
        <circle cx="56" cy="56" r="52" fill="none" stroke="#4f6b42" strokeWidth="0.9" opacity="0.55" />

        {/* Large Z signature filling the globe */}
        <g clipPath="url(#lm-clip)">
          <g transform="translate(56 56) scale(0.52) translate(-58 -34) rotate(-4 58 34) skewX(-6)">
            <path
              className="lm-stroke"
              fill="none"
              stroke="#6b1626"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
              d="M 40 22
                 C 48 18, 60 20, 66 22
                 C 60 28, 52 36, 44 46
                 C 52 44, 62 44, 70 46
                 C 84 46, 92 38, 88 30
                 C 80 14, 50 12, 30 22
                 C 12 32, 20 52, 46 54
                 C 76 58, 98 50, 104 42"
            />
          </g>
        </g>
      </svg>
    </span>
  );
}
