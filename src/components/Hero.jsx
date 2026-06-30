function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5V2.75M12 21.25V19.5M4.5 12H2.75M21.25 12H19.5M6.05 6.05 4.8 4.8M19.2 19.2l-1.25-1.25M17.95 6.05 19.2 4.8M4.8 19.2l1.25-1.25M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 14.4A8.4 8.4 0 0 1 9.6 3a8.8 8.8 0 1 0 11.4 11.4Z" />
    </svg>
  );
}

export default function Header({ rowsCount, tablesCount, theme, onToggleTheme }) {
  return (
    <header className="app-header">
      <div className="header-copy">
        <p className="eyebrow">Филиал МГУ в Душанбе</p>
        <h1>Панель управления учебной базой</h1>
        <p className="header-subtitle">
          Единый центр для справочников, расписаний и успеваемости с акцентом на скорость и читаемость.
        </p>
      </div>

      <div className="header-panel">
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

        <button
          className="theme-switch"
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
          aria-pressed={theme === 'dark'}
        >
          <span className={`theme-switch-track ${theme}`}>
            <span className="theme-switch-thumb">
              <span className="theme-switch-icon sun">
                <SunIcon />
              </span>
              <span className="theme-switch-icon moon">
                <MoonIcon />
              </span>
            </span>
          </span>
          <span className="theme-switch-copy">
            <span className="theme-switch-label">Тема</span>
            <span className="theme-switch-value">{theme === 'dark' ? 'Тёмная' : 'Светлая'}</span>
          </span>
        </button>
      </div>
    </header>
  );
}
