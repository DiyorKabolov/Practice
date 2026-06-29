import { useCallback, useEffect, useMemo, useState } from 'react';
import { TABLES } from './tableConfig';
import { fetchLookups, fetchRows, createRow, updateRow, deleteRow } from './api';
import Header from './components/Hero';
import Sidebar from './components/Sidebar';
import DataTable from './components/DataTable';
import FormModal from './components/FormModal';

const INITIAL_TABLE = 'specialties';

function createEmptyRow(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = '';
    return acc;
  }, {});
}

export default function App() {
  const [currentTable, setCurrentTable] = useState(INITIAL_TABLE);
  const [rows, setRows] = useState([]);
  const [lookups, setLookups] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [draftRow, setDraftRow] = useState(() => createEmptyRow(TABLES[INITIAL_TABLE].fields));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState({ text: 'Готово к работе', type: 'ok' });
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const config = TABLES[currentTable];

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

  const handleSelectTable = (tableName) => {
    setCurrentTable(tableName);
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
          addToast(error.message, 'error');
          setStatus({ text: error.message, type: 'error' });
        }
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  return (
    <div className="page-shell">
      <Header rowsCount={rows.length} tablesCount={Object.keys(TABLES).length} />

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
              rows={filteredRows}
              onEdit={handleStartEdit}
              onDelete={handleDelete}
            />
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
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
