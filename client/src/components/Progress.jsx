export default function Progress({ value, label }) {
  const pct = Math.round(value * 100);
  return (
    <div className="progress">
      <div className="progress-label">
        <span>{label}</span>
        <b>{pct}%</b>
      </div>
      <progress value={value} max={1} aria-label={label} />
    </div>
  );
}
