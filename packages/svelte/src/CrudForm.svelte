<script lang="ts">
  import type { CrudStore } from './store';
  import type { FieldMeta, UiWidget } from '@faster-crud/core';

  interface Props {
    store: CrudStore<any>;
    mode: 'create' | 'edit';
    initialValues?: Record<string, any>;
    idKey?: string;
    onDone?: () => void;
  }

  let { store, mode, initialValues = {}, idKey = 'id', onDone }: Props = $props();

  let values = $state<Record<string, any>>({});

  $effect(() => {
    values = initialValues ? { ...initialValues } : {};
  });

  function widgetToInputType(widget?: UiWidget): string {
    switch (widget) {
      case 'number-input': return 'number';
      case 'password':     return 'password';
      case 'email':        return 'email';
      case 'date-picker':  return 'date';
      case 'checkbox':     return 'checkbox';
      default:             return 'text';
    }
  }

  function isFieldForOperation(field: FieldMeta, op: 'create' | 'edit'): boolean {
    if (field.ignore) return false;
    if (field.readonly && op === 'edit') return false;
    const opName = op === 'create' ? 'create' : 'update';
    if (field.deny?.includes(opName)) return false;
    return true;
  }

  let fields = $derived(
    store.meta
      ? Object.values(store.meta.fields).filter((f) => isFieldForOperation(f, mode))
      : []
  );

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (mode === 'create') {
      await store.create(values);
    } else {
      await store.update(initialValues?.[idKey], values);
    }
    onDone?.();
  }

  function handleChange(key: string, value: any) {
    values = { ...values, [key]: value };
  }
</script>

{#if store.meta}
  <form onsubmit={handleSubmit}>
    {#each fields as f}
      {@const widget = f.ui?.widget}
      {@const inputType = widgetToInputType(widget)}

      {#if widget === 'textarea'}
        <div>
          <label>
            {f.label || f.key}
            <textarea
              value={values[f.key] ?? ''}
              placeholder={f.ui?.placeholder}
              oninput={(e) => handleChange(f.key, (e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </label>
        </div>
      {:else if widget === 'select' && f.ui?.options}
        <div>
          <label>
            {f.label || f.key}
            <select
              value={values[f.key] ?? ''}
              onchange={(e) => handleChange(f.key, (e.target as HTMLSelectElement).value)}
            >
              <option value="">{f.ui.placeholder || '-- select --'}</option>
              {#each Object.entries(f.ui.options) as [val, label]}
                <option value={val}>{String(label)}</option>
              {/each}
            </select>
          </label>
        </div>
      {:else if widget === 'switch' || inputType === 'checkbox'}
        <div>
          <label>
            <input
              type="checkbox"
              checked={!!values[f.key]}
              onchange={(e) => handleChange(f.key, (e.target as HTMLInputElement).checked)}
            />
            {f.label || f.key}
          </label>
        </div>
      {:else}
        <div>
          <label>
            {f.label || f.key}
            <input
              type={inputType}
              value={values[f.key] ?? ''}
              placeholder={f.ui?.placeholder}
              oninput={(e) => handleChange(
                f.key,
                inputType === 'number'
                  ? Number((e.target as HTMLInputElement).value)
                  : (e.target as HTMLInputElement).value
              )}
            />
          </label>
        </div>
      {/if}
    {/each}
    <button type="submit">{mode === 'create' ? 'Create' : 'Save'}</button>
  </form>
{/if}
