/* eslint-disable @typescript-eslint/no-explicit-any */

const { parseArgs, parseFields, renderEntity, renderService, renderModule } = require('../index');

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('parses command and name from argv', () => {
    const result = parseArgs(['add', 'User']);
    expect(result.command).toBe('add');
    expect(result.name).toBe('User');
  });

  it('parses --fields flag', () => {
    const result = parseArgs(['add', 'User', '--fields', 'name:string,email:string']);
    expect(result.fields).toEqual([
      { name: 'name', type: 'string' },
      { name: 'email', type: 'string' },
    ]);
  });

  it('parses --outdir flag', () => {
    const result = parseArgs(['add', 'User', '--outdir', './src/modules']);
    expect(result.outdir).toBe('./src/modules');
  });

  it('parses all flags together', () => {
    const result = parseArgs([
      'add', 'User',
      '--fields', 'name:string,age:number',
      '--outdir', './out',
    ]);
    expect(result.command).toBe('add');
    expect(result.name).toBe('User');
    expect(result.fields).toHaveLength(2);
    expect(result.outdir).toBe('./out');
  });

  it('returns empty fields when --fields not provided', () => {
    const result = parseArgs(['add', 'User']);
    expect(result.fields).toEqual([]);
  });

  it('returns undefined outdir when --outdir not provided', () => {
    const result = parseArgs(['add', 'User']);
    expect(result.outdir).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// parseFields
// ---------------------------------------------------------------------------

describe('parseFields', () => {
  it('parses comma-separated name:type pairs', () => {
    const result = parseFields('name:string,email:string,age:number');
    expect(result).toEqual([
      { name: 'name', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'age', type: 'number' },
    ]);
  });

  it('supports boolean type', () => {
    const result = parseFields('active:boolean');
    expect(result).toEqual([{ name: 'active', type: 'boolean' }]);
  });

  it('supports Date type', () => {
    const result = parseFields('createdAt:Date');
    expect(result).toEqual([{ name: 'createdAt', type: 'Date' }]);
  });

  it('trims whitespace from names and types', () => {
    const result = parseFields(' name : string , email : string ');
    expect(result).toEqual([
      { name: 'name', type: 'string' },
      { name: 'email', type: 'string' },
    ]);
  });

  it('throws on invalid field definition (missing type)', () => {
    expect(() => parseFields('name')).toThrow('Invalid field definition');
  });

  it('throws on unsupported field type', () => {
    expect(() => parseFields('name:int')).toThrow('Unsupported field type');
  });

  it('filters out empty entries from trailing commas', () => {
    const result = parseFields('name:string,');
    expect(result).toEqual([{ name: 'name', type: 'string' }]);
  });
});

// ---------------------------------------------------------------------------
// renderEntity
// ---------------------------------------------------------------------------

describe('renderEntity', () => {
  it('produces valid TypeScript with @Resource and @Col decorators', () => {
    const fields = [
      { name: 'name', type: 'string' as const },
      { name: 'email', type: 'string' as const },
    ];
    const output = renderEntity('User', fields);

    expect(output).toContain("@Resource('users')");
    expect(output).toContain('export class User');
    expect(output).toContain('@PrimaryGeneratedColumn()');
    expect(output).toContain('id!: number');
  });

  it('includes @Col decorator with label for each field', () => {
    const fields = [{ name: 'name', type: 'string' as const }];
    const output = renderEntity('User', fields);

    expect(output).toContain("@Col({ label: 'Name' })");
    expect(output).toContain('name!: string');
  });

  it('maps field types to correct TypeORM column types', () => {
    const fields = [
      { name: 'title', type: 'string' as const },
      { name: 'count', type: 'number' as const },
      { name: 'active', type: 'boolean' as const },
      { name: 'createdAt', type: 'Date' as const },
    ];
    const output = renderEntity('Item', fields);

    expect(output).toContain("@Column({ type: 'varchar' })");
    expect(output).toContain("@Column({ type: 'int' })");
    expect(output).toContain("@Column({ type: 'boolean' })");
    expect(output).toContain("@Column({ type: 'datetime' })");
  });

  it('pluralizes resource name', () => {
    const output = renderEntity('Category', [{ name: 'name', type: 'string' as const }]);
    expect(output).toContain("@Resource('categorys')");
  });

  it('handles names already ending in s', () => {
    const output = renderEntity('Status', [{ name: 'label', type: 'string' as const }]);
    expect(output).toContain("@Resource('status')");
  });

  it('imports from typeorm and @faster-crud/core', () => {
    const output = renderEntity('User', [{ name: 'name', type: 'string' as const }]);
    expect(output).toContain("import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'");
    expect(output).toContain("import { Col, Resource } from '@faster-crud/core'");
  });
});

// ---------------------------------------------------------------------------
// renderService
// ---------------------------------------------------------------------------

describe('renderService', () => {
  it('generates @Injectable service extending TypeOrmResourceService', () => {
    const output = renderService('User');

    expect(output).toContain('@Injectable()');
    expect(output).toContain('export class UserService extends TypeOrmResourceService(User)');
    expect(output).toContain('@InjectRepository(User) repo: Repository<User>');
    expect(output).toContain('super(repo)');
  });

  it('imports from correct packages', () => {
    const output = renderService('User');

    expect(output).toContain("import { Injectable } from '@nestjs/common'");
    expect(output).toContain("import { InjectRepository } from '@nestjs/typeorm'");
    expect(output).toContain("import { Repository } from 'typeorm'");
    expect(output).toContain("import { TypeOrmResourceService } from '@faster-crud/typeorm'");
    expect(output).toContain("import { User } from './User.entity'");
  });
});

// ---------------------------------------------------------------------------
// renderModule
// ---------------------------------------------------------------------------

describe('renderModule', () => {
  it('generates NestJS module with controller and providers', () => {
    const output = renderModule('User');

    expect(output).toContain('@Module({');
    expect(output).toContain('TypeOrmModule.forFeature([User])');
    expect(output).toContain('controllers: [UserController]');
    expect(output).toContain('providers: [UserService]');
    expect(output).toContain('exports: [UserService]');
    expect(output).toContain('export class UserModule {}');
  });

  it('creates controller via CrudControllerFactory', () => {
    const output = renderModule('User');

    expect(output).toContain('const UserController = CrudControllerFactory.create(User, UserService)');
  });

  it('imports from correct packages', () => {
    const output = renderModule('User');

    expect(output).toContain("import { Module } from '@nestjs/common'");
    expect(output).toContain("import { TypeOrmModule } from '@nestjs/typeorm'");
    expect(output).toContain("import { CrudControllerFactory } from '@faster-crud/nest'");
    expect(output).toContain("import { User } from './User.entity'");
    expect(output).toContain("import { UserService } from './User.service'");
  });
});
