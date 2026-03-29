export function StatsCard({ icon: Icon, value, label, color = '#4f46e5', bgColor = '#eef2ff' }) {
  return (
    <div className="stats-card">
      <div className="stats-icon" style={{ background: bgColor, color }}>
        {Icon ? <Icon size={20} /> : null}
      </div>
      <div>
        <div className="stats-value">{value}</div>
        <div className="stats-label">{label}</div>
      </div>
    </div>
  );
}
