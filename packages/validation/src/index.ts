import 'reflect-metadata';
import { getFieldsMeta, type RuleMeta } from '@faster-crud/core';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
}

export type ValidationRules = Partial<Record<string, RuleMeta[]>>;

export function validateEntity(
  dto: Record<string, unknown>,
  Entity: Function,
  rules: ValidationRules = {},
): ValidationError[] {
  const fields = getFieldsMeta(Entity);
  const errors: ValidationError[] = [];

  for (const [field, fieldMeta] of Object.entries(fields)) {
    if (fieldMeta.ignore) {
      continue;
    }

    const value = dto[field];
    const fieldRules = [...(fieldMeta.rules ?? []), ...(rules[field] ?? [])];
    for (const rule of fieldRules) {
      const error = validateRule(field, value, rule);
      if (error) {
        errors.push(error);
      }
    }
  }

  return errors;
}

function validateRule(field: string, value: unknown, rule: RuleMeta): ValidationError | null {
  switch (rule.kind) {
    case 'required':
      if (value !== undefined && value !== null && value !== '') {
        return null;
      }
      return createError(field, rule.kind, rule.message ?? `${field} is required`);
    case 'email':
      if (isEmpty(value)) {
        return null;
      }
      if (typeof value === 'string' && EMAIL_RE.test(value)) {
        return null;
      }
      return createError(field, rule.kind, rule.message ?? `${field} must be a valid email`);
    case 'length':
      if (isEmpty(value)) {
        return null;
      }
      if (typeof value !== 'string') {
        return createError(field, rule.kind, rule.message ?? `${field} must be a string`);
      }
      if (typeof rule.params?.min === 'number' && value.length < rule.params.min) {
        return createError(
          field,
          rule.kind,
          rule.message ?? `${field} must be at least ${rule.params.min} characters`,
        );
      }
      if (typeof rule.params?.max === 'number' && value.length > rule.params.max) {
        return createError(
          field,
          rule.kind,
          rule.message ?? `${field} must be at most ${rule.params.max} characters`,
        );
      }
      return null;
    case 'range':
      if (isEmpty(value)) {
        return null;
      }
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return createError(field, rule.kind, rule.message ?? `${field} must be a number`);
      }
      if (typeof rule.params?.min === 'number' && value < rule.params.min) {
        return createError(field, rule.kind, rule.message ?? `${field} must be at least ${rule.params.min}`);
      }
      if (typeof rule.params?.max === 'number' && value > rule.params.max) {
        return createError(field, rule.kind, rule.message ?? `${field} must be at most ${rule.params.max}`);
      }
      return null;
    case 'pattern':
      if (isEmpty(value)) {
        return null;
      }
      if (typeof rule.params?.source !== 'string') {
        return null;
      }
      if (new RegExp(rule.params.source, rule.params.flags ?? '').test(String(value))) {
        return null;
      }
      return createError(field, rule.kind, rule.message ?? `${field} is invalid`);
    default:
      return null;
  }
}

function createError(field: string, rule: string, message: string): ValidationError {
  return { field, rule, message };
}

function isEmpty(value: unknown): value is undefined | null | '' {
  return value === undefined || value === null || value === '';
}
