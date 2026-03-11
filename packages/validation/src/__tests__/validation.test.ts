import 'reflect-metadata';
import { Resource, Col } from '@faster-crud/core';
import { validateEntity, ValidationError } from '../index';
import type { RuleMeta } from '@faster-crud/core';

@Resource('user')
class UserEntity {
  @Col()
  name!: string;

  @Col()
  email!: string;

  @Col()
  age!: number;
}

describe('validateEntity', () => {
  describe('required rule', () => {
    const rules = { name: [{ kind: 'required' } as RuleMeta] };

    it('should pass when field is present', () => {
      const errors = validateEntity({ name: 'Alice' }, UserEntity, rules);
      expect(errors).toEqual([]);
    });

    it('should fail when field is missing', () => {
      const errors = validateEntity({}, UserEntity, rules);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
      expect(errors[0].rule).toBe('required');
    });

    it('should fail when field is empty string', () => {
      const errors = validateEntity({ name: '' }, UserEntity, rules);
      expect(errors).toHaveLength(1);
      expect(errors[0].rule).toBe('required');
    });

    it('should fail when field is null', () => {
      const errors = validateEntity({ name: null }, UserEntity, rules);
      expect(errors).toHaveLength(1);
    });
  });

  describe('email rule', () => {
    const rules = { email: [{ kind: 'email' } as RuleMeta] };

    it('should pass for valid email', () => {
      const errors = validateEntity({ email: 'test@example.com' }, UserEntity, rules);
      expect(errors).toEqual([]);
    });

    it('should fail for invalid email', () => {
      const errors = validateEntity({ email: 'not-an-email' }, UserEntity, rules);
      expect(errors).toHaveLength(1);
      expect(errors[0].rule).toBe('email');
    });

    it('should skip validation for empty value', () => {
      const errors = validateEntity({ email: '' }, UserEntity, rules);
      expect(errors).toEqual([]);
    });

    it('should skip validation for undefined', () => {
      const errors = validateEntity({}, UserEntity, rules);
      expect(errors).toEqual([]);
    });
  });

  describe('length rule', () => {
    const rules = {
      name: [{ kind: 'length', params: { min: 2, max: 10 } } as RuleMeta],
    };

    it('should pass when length is within range', () => {
      const errors = validateEntity({ name: 'Alice' }, UserEntity, rules);
      expect(errors).toEqual([]);
    });

    it('should fail when too short', () => {
      const errors = validateEntity({ name: 'A' }, UserEntity, rules);
      expect(errors).toHaveLength(1);
      expect(errors[0].rule).toBe('length');
      expect(errors[0].message).toContain('at least 2');
    });

    it('should fail when too long', () => {
      const errors = validateEntity({ name: 'A'.repeat(11) }, UserEntity, rules);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('at most 10');
    });

    it('should fail for non-string value', () => {
      const errors = validateEntity({ name: 123 }, UserEntity, rules);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('string');
    });

    it('should skip empty value', () => {
      const errors = validateEntity({}, UserEntity, rules);
      expect(errors).toEqual([]);
    });
  });

  describe('range rule', () => {
    const rules = {
      age: [{ kind: 'range', params: { min: 0, max: 150 } } as RuleMeta],
    };

    it('should pass when value is in range', () => {
      const errors = validateEntity({ age: 25 }, UserEntity, rules);
      expect(errors).toEqual([]);
    });

    it('should fail when below min', () => {
      const errors = validateEntity({ age: -1 }, UserEntity, rules);
      expect(errors).toHaveLength(1);
      expect(errors[0].rule).toBe('range');
    });

    it('should fail when above max', () => {
      const errors = validateEntity({ age: 200 }, UserEntity, rules);
      expect(errors).toHaveLength(1);
    });

    it('should fail for non-number value', () => {
      const errors = validateEntity({ age: 'twenty' }, UserEntity, rules);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('number');
    });

    it('should fail for NaN', () => {
      const errors = validateEntity({ age: NaN }, UserEntity, rules);
      expect(errors).toHaveLength(1);
    });

    it('should skip empty value', () => {
      const errors = validateEntity({}, UserEntity, rules);
      expect(errors).toEqual([]);
    });
  });

  describe('pattern rule', () => {
    const rules = {
      name: [{ kind: 'pattern', params: { source: '^[A-Z]' } } as RuleMeta],
    };

    it('should pass when pattern matches', () => {
      const errors = validateEntity({ name: 'Alice' }, UserEntity, rules);
      expect(errors).toEqual([]);
    });

    it('should fail when pattern does not match', () => {
      const errors = validateEntity({ name: 'alice' }, UserEntity, rules);
      expect(errors).toHaveLength(1);
      expect(errors[0].rule).toBe('pattern');
    });

    it('should skip empty value', () => {
      const errors = validateEntity({}, UserEntity, rules);
      expect(errors).toEqual([]);
    });
  });

  describe('ValidationError shape', () => {
    it('should have field, rule, and message properties', () => {
      const rules = { name: [{ kind: 'required' } as RuleMeta] };
      const errors = validateEntity({}, UserEntity, rules);
      expect(errors).toHaveLength(1);
      const err: ValidationError = errors[0];
      expect(err).toHaveProperty('field');
      expect(err).toHaveProperty('rule');
      expect(err).toHaveProperty('message');
    });

    it('should use custom message when provided', () => {
      const rules = {
        name: [{ kind: 'required', message: 'Name is mandatory' } as RuleMeta],
      };
      const errors = validateEntity({}, UserEntity, rules);
      expect(errors[0].message).toBe('Name is mandatory');
    });
  });

  describe('multiple rules', () => {
    it('should collect errors from multiple rules', () => {
      const rules = {
        name: [
          { kind: 'required' } as RuleMeta,
          { kind: 'length', params: { min: 2 } } as RuleMeta,
        ],
        email: [{ kind: 'required' } as RuleMeta],
      };
      const errors = validateEntity({}, UserEntity, rules);
      // name: required fails (length skipped because empty), email: required fails
      expect(errors).toHaveLength(2);
    });
  });

  describe('no rules', () => {
    it('should return empty errors when no rules', () => {
      const errors = validateEntity({ name: 'Alice' }, UserEntity);
      expect(errors).toEqual([]);
    });
  });
});
