import 'reflect-metadata';
import { FIELDS_META } from './tokens';
import { FieldMeta, RuleMeta } from './types';

export namespace Rule {
  export function required(message?: string): PropertyDecorator {
    return addRule({ kind: 'required', message });
  }
  export function length(min: number, max: number, message?: string): PropertyDecorator {
    return addRule({ kind: 'length', params: { min, max }, message });
  }
  export function range(min: number, max: number, message?: string): PropertyDecorator {
    return addRule({ kind: 'range', params: { min, max }, message });
  }
  export function email(message?: string): PropertyDecorator {
    return addRule({ kind: 'email', message });
  }
  export function pattern(regex: RegExp, message?: string): PropertyDecorator {
    return addRule({ kind: 'pattern', params: { source: regex.source, flags: regex.flags }, message });
  }

  function addRule(rule: RuleMeta): PropertyDecorator {
    return (target, key) => {
      const fields: Record<string, FieldMeta> = Reflect.getMetadata(FIELDS_META, target) ?? {};
      const f = fields[key as string] ?? { key: key as string, type: 'any' };
      f.rules = [...(f.rules ?? []), rule];
      fields[key as string] = f;
      Reflect.defineMetadata(FIELDS_META, fields, target);
    };
  }
}
