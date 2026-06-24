export default function Header({ rowsCount, tablesCount }) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Филиал МГУ в Душанбе</p>
        <h1>Панель управления учебной базой</h1>
      </div>

      <div className="header-metrics" aria-label="Сводка">
        <div className="metric">
          <span className="metric-value">{tablesCount}</span>
          <span className="metric-label">разделов</span>
        </div>
        <div className="metric">
          <span className="metric-value">{rowsCount}</span>
          <span className="metric-label">строк открыто</span>
        </div>
      </div>
    </header>
  );
}
