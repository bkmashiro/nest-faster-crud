import { createSignal, createEffect, For, Show, Switch, Match } from 'solid-js';
import type { FieldMeta, UiWidget } from '@faster-crud/core';
import type { CrudStoreReturn } from './createCrudStore';

export interface CrudFormProps<T = any> {
  store: CrudStoreReturn<T>;
  mode: 'create' | 'edit';
  initialValues?: T;
  idKey?: string;
  onSuccess?: () => void;
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

function isFieldForMode(field: FieldMeta, mode: 'create' | 'edit'): boolean {
  if (field.ignore) return false;
  if (field.readonly && mode === 'edit') return false;
  const op = mode === 'create' ? 'create' : 'update';
  if (field.deny?.includes(op)) return false;
  return true;
}

export function CrudForm<T extends Record<string, any>>(props: CrudFormProps<T>) {
  const [values, setValues] = createSignal<Record<string, any>>({});

  createEffect(() => {
    setValues(props.initialValues ? { ...props.initialValues } : {});
  });

  const fields = () => {
    const m = props.store.meta();
    return m ? Object.values(m.fields).filter((f) => isFieldForMode(f, props.mode)) : [];
  };

  const idKey = () => props.idKey ?? 'id';

  const handleChange = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (props.mode === 'create') {
      await props.store.create(values() as Partial<T>);
    } else {
      await props.store.update((props.initialValues as any)?.[idKey()], values() as Partial<T>);
    }
    props.onSuccess?.();
  };

  return (
    <Show when={props.store.meta()}>
      <form onSubmit={handleSubmit}>
        <For each={fields()}>
          {(f) => {
            const widget = f.ui?.widget;

            return (
              <Switch
                fallback={
                  <div>
                    <label>
                      {f.label || f.key}
                      <input
                        type={widgetToInputType(widget)}
                        value={
                          widgetToInputType(widget) === 'checkbox'
                            ? undefined
                            : (values()[f.key] ?? '')
                        }
                        checked={
                          widgetToInputType(widget) === 'checkbox'
                            ? !!values()[f.key]
                            : undefined
                        }
                        placeholder={f.ui?.placeholder}
                        onChange={(e) =>
                          handleChange(
                            f.key,
                            widgetToInputType(widget) === 'checkbox'
                              ? e.currentTarget.checked
                              : widgetToInputType(widget) === 'number'
                                ? Number(e.currentTarget.value)
                                : e.currentTarget.value,
                          )
                        }
                      />
                    </label>
                  </div>
                }
              >
                <Match when={widget === 'textarea'}>
                  <div>
                    <label>
                      {f.label || f.key}
                      <textarea
                        value={values()[f.key] ?? ''}
                        placeholder={f.ui?.placeholder}
                        onInput={(e) => handleChange(f.key, e.currentTarget.value)}
                      />
                    </label>
                  </div>
                </Match>
                <Match when={widget === 'select' && f.ui?.options}>
                  <div>
                    <label>
                      {f.label || f.key}
                      <select
                        value={values()[f.key] ?? ''}
                        onChange={(e) => handleChange(f.key, e.currentTarget.value)}
                      >
                        <option value="">{f.ui!.placeholder || '-- select --'}</option>
                        <For each={Object.entries(f.ui!.options!)}>
                          {([val, label]) => <option value={val}>{String(label)}</option>}
                        </For>
                      </select>
                    </label>
                  </div>
                </Match>
                <Match when={widget === 'switch'}>
                  <div>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!values()[f.key]}
                        onChange={(e) => handleChange(f.key, e.currentTarget.checked)}
                      />
                      {f.label || f.key}
                    </label>
                  </div>
                </Match>
              </Switch>
            );
          }}
        </For>
        <button type="submit">{props.mode === 'create' ? 'Create' : 'Save'}</button>
      </form>
    </Show>
  );
}
