import 'reflect-metadata';
import { Rule, getFieldsMeta } from '../../src';

describe('Rule decorators', () => {
  describe('Rule.required', () => {
    it('adds a required rule', () => {
      class E {
        @Rule.required()
        name!: string;
      }
      const rules = getFieldsMeta(E)['name'].rules!;
      expect(rules).toHaveLength(1);
      expect(rules[0]).toEqual({ kind: 'required', message: undefined });
    });

    it('accepts custom message', () => {
      class E {
        @Rule.required('Name needed')
        name!: string;
      }
      expect(getFieldsMeta(E)['name'].rules![0].message).toBe('Name needed');
    });
  });

  describe('Rule.length', () => {
    it('adds length rule with min/max', () => {
      class E {
        @Rule.length(2, 50)
        name!: string;
      }
      const rule = getFieldsMeta(E)['name'].rules![0];
      expect(rule.kind).toBe('length');
      expect(rule.params).toEqual({ min: 2, max: 50 });
    });
  });

  describe('Rule.range', () => {
    it('adds range rule with min/max', () => {
      class E {
        @Rule.range(0, 100)
        age!: number;
      }
      const rule = getFieldsMeta(E)['age'].rules![0];
      expect(rule.kind).toBe('range');
      expect(rule.params).toEqual({ min: 0, max: 100 });
    });
  });

  describe('Rule.email', () => {
    it('adds email rule', () => {
      class E {
        @Rule.email()
        email!: string;
      }
      const rule = getFieldsMeta(E)['email'].rules![0];
      expect(rule.kind).toBe('email');
    });
  });

  describe('Rule.pattern', () => {
    it('adds pattern rule with regex source and flags', () => {
      class E {
        @Rule.pattern(/^[a-z]+$/i, 'lowercase only')
        code!: string;
      }
      const rule = getFieldsMeta(E)['code'].rules![0];
      expect(rule.kind).toBe('pattern');
      expect(rule.params).toEqual({ source: '^[a-z]+$', flags: 'i' });
      expect(rule.message).toBe('lowercase only');
    });
  });

  describe('multiple rules on one field', () => {
    it('stacks rules in order', () => {
      class E {
        @Rule.required()
        @Rule.length(1, 100)
        @Rule.pattern(/^\S+$/)
        name!: string;
      }
      const rules = getFieldsMeta(E)['name'].rules!;
      expect(rules).toHaveLength(3);
      // Decorators execute bottom-up: pattern, length, required
      expect(rules.map((r: any) => r.kind)).toEqual(['pattern', 'length', 'required']);
    });
  });
});
