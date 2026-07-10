export function Icon({
  name,
  className = "",
  size = 20,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  return (
    <i
      className={`ti ti-${name} ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    />
  );
}
