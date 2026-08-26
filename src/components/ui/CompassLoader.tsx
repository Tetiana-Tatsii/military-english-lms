"use client";

interface CompassLoaderProps {
  size?: number;
  className?: string;
}

/** Slow-spinning compass needle — used for page and button loading. */
export default function CompassLoader({
  size = 48,
  className,
}: CompassLoaderProps) {
  const stroke = "#8a8a45";
  const showLetters = size >= 36;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="24" cy="24" r="20" stroke={stroke} strokeWidth="1.6" />
      <circle cx="24" cy="24" r="15" stroke={stroke} strokeWidth="0.7" opacity="0.45" />

      {/* Cardinal ticks */}
      <path
        d="M24 5.5V10.5M24 37.5V42.5M5.5 24H10.5M37.5 24H42.5"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Intercardinal ticks */}
      <path
        d="M10.6 10.6L13.8 13.8M34.2 34.2L37.4 37.4M37.4 10.6L34.2 13.8M13.8 34.2L10.6 37.4"
        stroke={stroke}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.7"
      />

      {showLetters && (
        <>
          <text
            x="24"
            y="9.2"
            textAnchor="middle"
            fill={stroke}
            fontSize="5.5"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            N
          </text>
          <text
            x="24"
            y="43.4"
            textAnchor="middle"
            fill={stroke}
            fontSize="5"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
          >
            S
          </text>
        </>
      )}

      <g className="compass-needle">
        <polygon points="24,9 27.2,24 24,22.2 20.8,24" fill={stroke} />
        <polygon points="24,39 27.2,24 24,25.8 20.8,24" fill={stroke} opacity="0.38" />
        <circle cx="24" cy="24" r="2.1" fill="#c79a3e" stroke={stroke} strokeWidth="0.8" />
      </g>
    </svg>
  );
}
