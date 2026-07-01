function formatCell(value) {
  if (value === null || value === undefined || value === '') {
    return <span className="cell-null">—</span>;
  }

  return String(value);
}

function getDisplayValue(row, column) {
  if (column === 'CalculatedControlHours') {
    return row.CalculatedControlHours ?? row.ControlHours;
  }

  return row[column];
}

export default function DataTable({ config, rows, onEdit, onDelete, onSort, sortConfig }) {
  const getColumnLabel = (column) => config.columnLabels?.[column] || column;
  const getSortIndicator = (column) => {
    if (sortConfig?.column !== column) {
      return '';
    }

    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  if (!rows.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭 Нет данных</div>
        <div>Добавьте первую запись или проверьте подключение к базе.</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {config.columns.map((column) => (
              <th key={column}>
                <button
                  type="button"
                  className="table-head-btn"
                  onClick={() => onSort?.(column)}
                >
                  <span>{getColumnLabel(column)}</span>
                  <span className="table-head-sort">{getSortIndicator(column)}</span>
                </button>
              </th>
            ))}
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[config.key]}>
              {config.columns.map((column) => (
                <td key={column}>{formatCell(getDisplayValue(row, column))}</td>
              ))}
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    title="Редактировать запись"
                    onClick={() => onEdit(row[config.key])}
                  >
                    ✏️ Изменить
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    title="Удалить запись"
                    onClick={() => onDelete(row[config.key])}
                  >
                    🗑 Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
