export function LogoMark({ size = 28 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <ellipse cx="24" cy="24" rx="15" ry="20" transform="rotate(30 24 24)" fill="currentColor" />
      <path
        className="crease"
        d="M14 36 C22 28, 26 20, 34 12"
        stroke="#f3f4ef"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo-text">Malnad Roasters</span>
    </span>
  );
}
