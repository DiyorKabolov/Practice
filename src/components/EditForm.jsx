import { useEffect, useMemo, useRef, useState } from 'react';

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll('ё', 'е')
    .trim();
}

function SearchableSelect({ field, value, options, onChange }) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)) || null,
    [options, value]
  );

  useEffect(() => {
    if (!open) {
      setQuery(selectedOption?.label || '');
    }
  }, [open, selectedOption]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setQuery(selectedOption?.label || '');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [selectedOption]);

  const filteredOptions = useMemo(() => {
    const term = normalizeText(query);
    const scored = options
      .map((option) => {
        const label = String(option.label || '');
        const normalized = normalizeText(label);
        const exact = normalized === term;
        const startsWith = normalized.startsWith(term);
        const includes = normalized.includes(term);

        return {
          ...option,
          label,
          normalized,
          score: term
            ? (exact ? 0 : startsWith ? 1 : includes ? 2 : 3)
            : 0,
        };
      })
      .filter((option) => !term || option.score < 3)
      .sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }
        return a.label.localeCompare(b.label, 'ru');
      });

    return scored.slice(0, 7);
  }, [options, query]);

  const commitValue = (option) => {
    onChange(String(option.value));
    setQuery(option.label);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setQuery(selectedOption?.label || '');
      return;
    }

    if (event.key === 'Enter' && filteredOptions.length > 0) {
      event.preventDefault();
      commitValue(filteredOptions[0]);
    }
  };

  const showValue = open ? query : selectedOption?.label || query;

  return (
    <div className="field field-combo" ref={rootRef}>
      <label className="field-label" htmlFor={`field-${field.name}`}>
        {field.label}
      </label>
      <div className="combo-shell">
        <input
          ref={inputRef}
          id={`field-${field.name}`}
          className="combo-input"
          type="text"
          value={showValue}
          placeholder="Начните вводить..."
          autoComplete="off"
          spellCheck="false"
          onFocus={() => {
            setOpen(true);
            setQuery(selectedOption?.label || '');
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={`combo-toggle ${open ? 'open' : ''}`}
          aria-label="Открыть список"
          onClick={() => {
            setOpen((current) => !current);
            if (!open) {
              setQuery(selectedOption?.label || '');
            }
          }}
        >
          <span />
        </button>
      </div>
      <input
        className="combo-validate"
        type="text"
        value={value}
        required={Boolean(field.required)}
        tabIndex={-1}
        aria-hidden="true"
        readOnly
      />
      {open && (
        <div className="combo-menu" role="listbox" aria-label={field.label}>
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                className="combo-option"
                role="option"
                aria-selected={String(value) === String(option.value)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commitValue(option)}
              >
                <span className="combo-option-label">{option.label}</span>
                {String(value) === String(option.value) && <span className="combo-option-check">Выбрано</span>}
              </button>
            ))
          ) : (
            <div className="combo-empty">Ничего не найдено</div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectField({ field, value, options, onChange }) {
  const searchable = true;

  if (searchable) {
    return <SearchableSelect field={field} value={value} options={options} onChange={onChange} />;
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={`field-${field.name}`}>
        {field.label}
      </label>
      <select
        id={`field-${field.name}`}
        className="field-select"
        value={value}
        required={Boolean(field.required)}
        onChange={(event) => onChange(event.target.value)}
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
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }
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

  useEffect(() => {
    const markField = config.fields.find((field) => field.name === 'MarkCode');
    if (!markField) {
      return;
    }

    const options = getSelectOptions(markField).map(normalizeOption);
    if (!options.length) {
      return;
    }

    const currentValue = String(draftRow.MarkCode ?? '');
    const isValid = options.some((option) => String(option.value) === currentValue);

    if (!isValid && currentValue !== '') {
      onDraftChange((prev) => ({ ...prev, MarkCode: '' }));
    }
  }, [config.fields, draftRow.ControlForm, draftRow.MarkCode, lookups, onDraftChange]);

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
            <SelectField
              key={field.name}
              field={field}
              value={value}
              options={options}
              onChange={(nextValue) => setFieldValue(field.name, nextValue)}
            />
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
