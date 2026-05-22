export default function StatCard({ num, label, sub, color, onClick }) {
  return (
    <div className="stat-card" style={{ cursor: 'pointer', textAlign: 'left' }} onClick={onClick}>
      <div className="stat-num" style={{ color, fontSize: 34 }}>{num}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}
