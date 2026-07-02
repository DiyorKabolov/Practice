import { useEffect, useMemo, useRef, useState } from 'react';

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll('ё', 'е')
    .trim();
}

function SearchableSelect({ field, value, options, onChange, error }) {
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
      .filter((option) => !term || option.score < 3);

    if (!term) {
      return scored.slice(0, 7);
    }

    return scored
      .sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }
        return a.label.localeCompare(b.label, 'ru');
      })
      .slice(0, 7);
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
    <div className={`field field-combo ${error ? 'field-has-error' : ''}`} ref={rootRef}>
      <label className="field-label" htmlFor={`field-${field.name}`}>
        {field.label}{field.required && <span className="field-required">*</span>}
      </label>
      <div className="combo-shell">
        <input
          ref={inputRef}
          id={`field-${field.name}`}
          className={`combo-input ${error ? 'input-error' : ''}`}
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
      {error && <div className="field-error">{error}</div>}
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

function SelectField({ field, value, options, onChange, error }) {
  return <SearchableSelect field={field} value={value} options={options} onChange={onChange} error={error} />;
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setFieldValue = (fieldName, value) => {
    onDraftChange((prev) => ({ ...prev, [fieldName]: value }));
    // Validate on change if already touched
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const field = config.fields.find((f) => f.name === fieldName);
    if (field?.validate) {
      const err = field.validate(value, { ...draftRow, [fieldName]: value });
      setFieldErrors((prev) => ({ ...prev, [fieldName]: err || null }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const validateAll = () => {
    const errors = {};
    let hasErrors = false;

    for (const field of config.fields) {
      const value = draftRow[field.name] ?? '';

      // Required check for non-select fields
      if (field.required && field.type !== 'select' && (!value || String(value).trim() === '')) {
        errors[field.name] = 'Поле обязательно для заполнения';
        hasErrors = true;
        continue;
      }

      if (field.validate) {
        const err = field.validate(value, draftRow);
        if (err) {
          errors[field.name] = err;
          hasErrors = true;
        }
      }
    }

    setFieldErrors(errors);
    setTouched(Object.fromEntries(config.fields.map((f) => [f.name, true])));
    return !hasErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const valid = validateAll();
    if (!valid) return;

    // Also check native browser validity (for required selects etc.)
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

  useEffect(() => {
    const markField = config.fields.find((field) => field.name === 'Mark');
    if (!markField || markField.type !== 'select') {
      return;
    }

    const options = getSelectOptions(markField).map(normalizeOption);
    if (!options.length) {
      return;
    }

    const currentValue = String(draftRow.Mark ?? '');
    const isValid = options.some((option) => String(option.value) === currentValue);

    if (!isValid && currentValue !== '') {
      onDraftChange((prev) => ({ ...prev, Mark: '' }));
    }
  }, [config.fields, draftRow.Mark, lookups, onDraftChange]);

  // Clear errors when switching records
  useEffect(() => {
    setFieldErrors({});
    setTouched({});
  }, [editingId]);

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
    <form className="edit-form" onSubmit={handleSubmit} noValidate>
      {config.fields.map((field) => {
        const value = draftRow[field.name] ?? '';
        const error = fieldErrors[field.name] || null;

        if (field.type === 'select') {
          const options = getSelectOptions(field).map(normalizeOption);
          return (
            <SelectField
              key={field.name}
              field={field}
              value={value}
              options={options}
              onChange={(nextValue) => setFieldValue(field.name, nextValue)}
              error={error}
            />
          );
        }

        return (
          <div className={`field ${error ? 'field-has-error' : ''}`} key={field.name}>
            <label className="field-label" htmlFor={`field-${field.name}`}>
              {field.label}{field.required && <span className="field-required">*</span>}
            </label>
            <input
              id={`field-${field.name}`}
              className={`field-input ${error ? 'input-error' : ''}`}
              type={field.type}
              value={value}
              required={Boolean(field.required)}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(event) => setFieldValue(field.name, event.target.value)}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, [field.name]: true }));
                if (field.validate) {
                  const err = field.validate(value, draftRow);
                  setFieldErrors((prev) => ({ ...prev, [field.name]: err || null }));
                }
              }}
            />
            {error && <div className="field-error">{error}</div>}
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
