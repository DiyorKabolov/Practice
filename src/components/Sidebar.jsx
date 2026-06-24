export default function Sidebar({ tables, currentTable, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-panel">
        <div className="panel-title">Разделы</div>
        <div className="table-list">
          {Object.entries(tables).map(([key, table]) => (
            <button
              key={key}
              type="button"
              className={`table-btn ${key === currentTable ? 'active' : ''}`}
              onClick={() => onSelect(key)}
            >
              <span className="table-btn-icon">{table.icon}</span>
              <span>{table.title}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
