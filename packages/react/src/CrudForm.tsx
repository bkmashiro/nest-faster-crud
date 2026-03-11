import React, { useState, useEffect } from 'react';
import type { UseCrudReturn } from './useCrud';
import type { FieldMeta, UiWidget } from '@faster-crud/core';

export interface CrudFormProps<T = any> {
  crud: UseCrudReturn<T>;
  mode: 'create' | 'edit';
  initialValues?: Partial<T>;
  idKey?: string;
  onDone?: () => void;
}

function widgetToInputType(widget?: UiWidget): string {
  switch (widget) {
    case 'number-input':
      return 'number';
    case 'password':
      return 'password';
    case 'email':
      return 'email';
    case 'date-picker':
      return 'date';
    case 'checkbox':
      return 'checkbox';
    default:
      return 'text';
  }
}

function isFieldForOperation(field: FieldMeta, mode: 'create' | 'edit'): boolean {
  if (field.ignore) return false;
  if (field.readonly && mode === 'edit') return false;
  const op = mode === 'create' ? 'create' : 'update';
  if (field.deny?.includes(op)) return false;
  return true;
}

export function CrudForm<T extends Record<string, any>>({
  crud,
  mode,
  initialValues,
  idKey = 'id',
  onDone,
}: CrudFormProps<T>) {
  const { meta, create, update } = crud;
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    setValues(initialValues ? { ...initialValues } : {});
  }, [initialValues]);

  if (!meta) return null;

  const fields = Object.values(meta.fields).filter((f) => isFieldForOperation(f, mode));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      await create(values as Partial<T>);
    } else {
      await update((initialValues as any)?.[idKey], values as Partial<T>);
    }
    onDone?.();
  };

  const handleChange = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((f) => {
        const widget = f.ui?.widget;

        if (widget === 'textarea') {
          return (
            <div key={f.key}>
              <label>
                {f.label || f.key}
                <textarea
                  value={values[f.key] ?? ''}
                  placeholder={f.ui?.placeholder}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                />
              </label>
            </div>
          );
        }

        if (widget === 'select' && f.ui?.options) {
          return (
            <div key={f.key}>
              <label>
                {f.label || f.key}
                <select
                  value={values[f.key] ?? ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                >
                  <option value="">{f.ui.placeholder || '-- select --'}</option>
                  {Object.entries(f.ui.options).map(([val, label]) => (
                    <option key={val} value={val}>
                      {String(label)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          );
        }

        if (widget === 'switch') {
          return (
            <div key={f.key}>
              <label>
                <input
                  type="checkbox"
                  checked={!!values[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.checked)}
                />
                {f.label || f.key}
              </label>
            </div>
          );
        }

        const inputType = widgetToInputType(widget);

        if (inputType === 'checkbox') {
          return (
            <div key={f.key}>
              <label>
                <input
                  type="checkbox"
                  checked={!!values[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.checked)}
                />
                {f.label || f.key}
              </label>
            </div>
          );
        }

        return (
          <div key={f.key}>
            <label>
              {f.label || f.key}
              <input
                type={inputType}
                value={values[f.key] ?? ''}
                placeholder={f.ui?.placeholder}
                onChange={(e) =>
                  handleChange(f.key, inputType === 'number' ? Number(e.target.value) : e.target.value)
                }
              />
            </label>
          </div>
        );
      })}
      <button type="submit">{mode === 'create' ? 'Create' : 'Save'}</button>
    </form>
  );
}
