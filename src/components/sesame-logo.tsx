export function SesameLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#B5651D" />
      <g fill="#F5E6C8">
        <ellipse cx="11" cy="12" rx="2.6" ry="4" transform="rotate(-30 11 12)" />
        <ellipse cx="21" cy="12" rx="2.6" ry="4" transform="rotate(30 21 12)" />
        <ellipse cx="16" cy="21" rx="2.6" ry="4" />
      </g>
    </svg>
  );
}
