export default function EditForm({
  config,
  lookups,
  editingId,
  draftRow,
  onDraftChange,
  onSave,
  onCancel,
}) {
  const setFieldValue = (fieldName, value) => {
    onDraftChange((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(draftRow);
  };

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      {config.fields.map((field) => {
        const value = draftRow[field.name] ?? '';

        if (field.type === 'select') {
          const options = lookups[field.lookup] || [];
          return (
            <div className="field" key={field.name}>
              <label className="field-label" htmlFor={`field-${field.name}`}>
                {field.label}
              </label>
              <select
                id={`field-${field.name}`}
                className="field-select"
                value={value}
                required={Boolean(field.required)}
                onChange={(event) => setFieldValue(field.name, event.target.value)}
              >
                <option value="">Выберите значение</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div className="field" key={field.name}>
            <label className="field-label" htmlFor={`field-${field.name}`}>
              {field.label}
            </label>
            <input
              id={`field-${field.name}`}
              className="field-input"
              type={field.type}
              value={value}
              required={Boolean(field.required)}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(event) => setFieldValue(field.name, event.target.value)}
            />
          </div>
        );
      })}

      <div className="form-actions">
        <button className="btn btn-primary" type="submit">
          {editingId ? 'Сохранить изменения' : 'Добавить запись'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Очистить
        </button>
      </div>
    </form>
  );
}
