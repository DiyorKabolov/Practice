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

  const getSelectOptions = (field) => {
    if (typeof field.getOptions === 'function') {
      return field.getOptions(draftRow, lookups) || [];
    }

    if (Array.isArray(field.options)) {
      return field.options;
    }

    return lookups[field.lookup] || [];
  };

  const normalizeOption = (option) => {
    if (option && typeof option === 'object' && 'value' in option && 'label' in option) {
      return option;
    }

    if (option && typeof option === 'object' && 'id' in option && 'label' in option) {
      return { value: option.id, label: option.label };
    }

    return { value: option, label: String(option) };
  };

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      {config.fields.map((field) => {
        const value = draftRow[field.name] ?? '';

        if (field.type === 'select') {
          const options = getSelectOptions(field).map(normalizeOption);
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
                  <option key={String(option.value)} value={option.value}>
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
          Отмена
        </button>
      </div>
    </form>
  );
}
