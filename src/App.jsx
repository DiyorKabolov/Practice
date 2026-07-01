import { useCallback, useEffect, useMemo, useState } from 'react';
import { TABLES } from './tableConfig';
import { fetchLookups, fetchRows, createRow, updateRow, deleteRow } from './api';
import Header from './components/Hero';
import Sidebar from './components/Sidebar';
import DataTable from './components/DataTable';
import FormModal from './components/FormModal';

const INITIAL_TABLE = 'specialties';
const THEME_STORAGE_KEY = 'msu-practice-theme';
const DEFAULT_PAGE_SIZE = 20;

function createEmptyRow(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = '';
    return acc;
  }, {});
}

function normalizeSortValue(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const text = String(value).trim();
  if (text !== '' && !Number.isNaN(Number(text))) {
    return Number(text);
  }

  const time = Date.parse(text);
  if (!Number.isNaN(time) && /^\d{4}-\d{2}-\d{2}/.test(text)) {
    return time;
  }

  return text.toLowerCase();
}

function sortRows(rows, sortConfig, keyField) {
  if (!sortConfig?.column) {
    return rows;
  }

  const directionFactor = sortConfig.direction === 'desc' ? -1 : 1;

  return [...rows].sort((left, right) => {
    const leftValue = normalizeSortValue(left[sortConfig.column]);
    const rightValue = normalizeSortValue(right[sortConfig.column]);

    if (leftValue < rightValue) return -1 * directionFactor;
    if (leftValue > rightValue) return 1 * directionFactor;

    const leftId = normalizeSortValue(left[keyField]);
    const rightId = normalizeSortValue(right[keyField]);
    if (leftId < rightId) return -1;
    if (leftId > rightId) return 1;
    return 0;
  });
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/["\n,;]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function buildCsv(columns, rows, getValue) {
  const lines = [columns.map(escapeCsv).join(',')];

  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsv(getValue(row, column))).join(','));
  }

  return `\ufeff${lines.join('\r\n')}`;
}

export default function App() {
  const [currentTable, setCurrentTable] = useState(INITIAL_TABLE);
  const [rows, setRows] = useState([]);
  const [lookups, setLookups] = useState({});
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  });
  const [editingId, setEditingId] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [draftRow, setDraftRow] = useState(() => createEmptyRow(TABLES[INITIAL_TABLE].fields));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState({ text: 'Готово к работе', type: 'ok' });
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  const config = TABLES[currentTable];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const loadLookups = useCallback(async () => {
    const data = await fetchLookups();
    setLookups(data);
  }, []);

  const loadRows = useCallback(async (tableName = currentTable) => {
    setStatus({ text: 'Загрузка данных...', type: 'loading' });
    try {
      const data = await fetchRows(tableName);
      setRows(data);
      setStatus({ text: `Загружено записей: ${data.length}`, type: 'ok' });
    } catch (error) {
      setRows([]);
      setStatus({ text: error.message, type: 'error' });
      addToast(error.message, 'error');
    }
  }, [addToast, currentTable]);

  useEffect(() => {
    loadLookups().catch((error) => {
      addToast(`Не удалось загрузить справочники: ${error.message}`, 'error');
    });
  }, [addToast, loadLookups]);

  useEffect(() => {
    setEditingId(null);
    setEditingRow(null);
    setDraftRow(createEmptyRow(config.fields));
    setSearch('');
    setFormOpen(false);
    setSortConfig({ column: null, direction: 'asc' });
    setPageSize(DEFAULT_PAGE_SIZE);
    setCurrentPage(1);
    loadRows(currentTable);
  }, [config.fields, currentTable, loadRows]);

  useEffect(() => {
    if (!editingRow) {
      setDraftRow(createEmptyRow(config.fields));
      return;
    }

    const nextDraft = createEmptyRow(config.fields);
    for (const field of config.fields) {
      nextDraft[field.name] = editingRow[field.name] ?? '';
    }
    setDraftRow(nextDraft);
  }, [config.fields, editingRow]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? '').toLowerCase().includes(term)
      )
    );
  }, [rows, search]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortConfig, config.key),
    [config.key, filteredRows, sortConfig]
  );

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedRows]);

  const handleSelectTable = (tableName) => {
    setCurrentTable(tableName);
  };

  const handleSort = (column) => {
    setSortConfig((current) => {
      if (current.column === column) {
        return {
          column,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { column, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    const csv = buildCsv(config.columns, sortedRows, (row, column) => {
      if (column === 'CalculatedControlHours') {
        return row.CalculatedControlHours ?? row.ControlHours;
      }

      return row[column];
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTable}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    addToast('Экспорт выполнен');
  };

  const handleToggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setEditingRow(null);
    setDraftRow(createEmptyRow(config.fields));
    setFormOpen(true);
  };

  const handleStartEdit = (id) => {
    const row = rows.find((item) => String(item[config.key]) === String(id));
    if (!row) {
      addToast('Запись не найдена. Обновите таблицу и попробуйте снова.', 'error');
      return;
    }

    setEditingId(id);
    setEditingRow({ ...row });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setEditingRow(null);
    setDraftRow(createEmptyRow(config.fields));
  };

  const handleSave = async (formData) => {
    try {
      if (editingId) {
        await updateRow(currentTable, editingId, formData);
        addToast('Запись обновлена');
      } else {
        await createRow(currentTable, formData);
        addToast('Запись добавлена');
      }

      await loadRows(currentTable);
      await loadLookups();
      handleCloseForm();
    } catch (error) {
      addToast(error.message, 'error');
      setStatus({ text: error.message, type: 'error' });
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      title: 'Удалить запись?',
      text: `Запись ID ${id} будет удалена без возможности отмены.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteRow(currentTable, id);
          if (String(editingId) === String(id)) {
            handleCloseForm();
          }
          addToast('Запись удалена');
          await loadRows(currentTable);
          await loadLookups();
        } catch (error) {
          if (error.status === 409 && Array.isArray(error.details?.dependencies) && error.details.dependencies.length) {
            const dependencySummary = error.details.dependencies
              .map((item) => `${item.dependency}${Number(item.count) > 1 ? ` (${item.count})` : ''}`)
              .join(', ');

            setConfirmModal({
              title: 'Удалить вместе со связанными?',
              text: `Есть связанные записи в разделах: ${dependencySummary}. Будут удалены и они.`,
              confirmLabel: 'Удалить всё',
              onConfirm: async () => {
                setConfirmModal(null);
                try {
                  await deleteRow(currentTable, id, { cascade: true });
                  if (String(editingId) === String(id)) {
                    handleCloseForm();
                  }
                  addToast('Запись удалена вместе со связанными');
                  await loadRows(currentTable);
                  await loadLookups();
                } catch (cascadeError) {
                  addToast(cascadeError.message, 'error');
                  setStatus({ text: cascadeError.message, type: 'error' });
                }
              },
              onCancel: () => setConfirmModal(null),
            });
            return;
          }

          addToast(error.message, 'error');
          setStatus({ text: error.message, type: 'error' });
        }
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  return (
    <div className="page-shell">
      <Header
        rowsCount={rows.length}
        tablesCount={Object.keys(TABLES).length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="layout">
        <Sidebar
          tables={TABLES}
          currentTable={currentTable}
          onSelect={handleSelectTable}
        />

        <section className="content">
          <div className="toolbar">
            <div>
              <h2>{config.title}</h2>
              <p className="toolbar-hint">{config.hint}</p>
            </div>

            <div className="toolbar-actions">
              <input
                className="search-input"
                type="search"
                placeholder="Поиск по таблице"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => loadRows(currentTable)}
              >
                Обновить
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleExportCsv}
                disabled={!sortedRows.length}
              >
                Экспорт CSV
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleOpenAdd}
              >
                + Добавить
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Данные</div>
            <div className="status-bar">
              <span
                className={`status-dot ${status.type === 'loading' ? 'loading' : ''} ${status.type === 'error' ? 'error' : ''}`}
              />
              <span>{status.text}</span>
            </div>
            <DataTable
              config={config}
              rows={pagedRows}
              onEdit={handleStartEdit}
              onDelete={handleDelete}
              onSort={handleSort}
              sortConfig={sortConfig}
            />

            <div className="table-footer">
              <div className="table-footer-info">
                <span>{sortedRows.length} записей</span>
                <span>Страница {currentPage} из {totalPages}</span>
              </div>
              <div className="table-footer-actions">
                <label className="page-size-control">
                  <span>Показывать</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </label>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage <= 1}
                >
                  Назад
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Вперёд
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FormModal
        open={formOpen}
        config={config}
        lookups={lookups}
        editingId={editingId}
        draftRow={draftRow}
        onDraftChange={setDraftRow}
        onSave={handleSave}
        onClose={handleCloseForm}
      />

      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <strong>{toast.type === 'error' ? 'Ошибка: ' : 'Готово: '}</strong>
            {toast.message}
          </div>
        ))}
      </div>

      {confirmModal && (
        <div className="modal-overlay" onClick={confirmModal.onCancel}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="modal-title">{confirmModal.title}</div>
            <div className="modal-text">{confirmModal.text}</div>
            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" onClick={confirmModal.onCancel}>
                Отмена
              </button>
              <button className="btn btn-danger" type="button" onClick={confirmModal.onConfirm}>
                {confirmModal.confirmLabel || 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
