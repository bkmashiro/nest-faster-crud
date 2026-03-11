#!/usr/bin/env node

declare const console: { error: (...args: any[]) => void };
declare const module: any;
declare const process: { argv: string[]; exit: (code?: number) => never };
declare const require: { (name: string): any; main?: any };

const fs = require('node:fs');
const path = require('node:path');

type SupportedFieldType = 'string' | 'number' | 'boolean' | 'Date';

interface FieldDefinition {
  name: string;
  type: SupportedFieldType;
}

interface ParsedArgs {
  command: string | undefined;
  name: string | undefined;
  fields: FieldDefinition[];
  outdir: string | undefined;
}

const TYPEORM_COLUMN_TYPES: Record<SupportedFieldType, string> = {
  string: 'varchar',
  number: 'int',
  boolean: 'boolean',
  Date: 'datetime',
};

function main(argv: string[]): void {
  const args = parseArgs(argv);

  if (args.command !== 'add' || !args.name) {
    printUsageAndExit('Expected command: add <Name>');
  }

  if (!args.outdir) {
    printUsageAndExit('Missing required --outdir <path>');
  }

  if (args.fields.length === 0) {
    printUsageAndExit('Missing required --fields "name:string,email:string"');
  }

  const outputDir = path.resolve(args.outdir, args.name);
  fs.mkdirSync(outputDir, { recursive: true });

  const entityPath = path.join(outputDir, `${args.name}.entity.ts`);
  const servicePath = path.join(outputDir, `${args.name}.service.ts`);
  const modulePath = path.join(outputDir, `${args.name}.module.ts`);

  fs.writeFileSync(entityPath, renderEntity(args.name, args.fields));
  fs.writeFileSync(servicePath, renderService(args.name));
  fs.writeFileSync(modulePath, renderModule(args.name));
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, name, ...rest] = argv;
  const parsed: ParsedArgs = {
    command,
    name,
    fields: [],
    outdir: undefined,
  };

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];

    if (token === '--fields') {
      const value = rest[i + 1];
      if (!value) {
        printUsageAndExit('Missing value for --fields');
      }
      parsed.fields = parseFields(value);
      i += 1;
      continue;
    }

    if (token === '--outdir') {
      const value = rest[i + 1];
      if (!value) {
        printUsageAndExit('Missing value for --outdir');
      }
      parsed.outdir = value;
      i += 1;
      continue;
    }

    printUsageAndExit(`Unknown argument: ${token}`);
  }

  return parsed;
}

function parseFields(raw: string): FieldDefinition[] {
  return raw
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const [rawName, rawType] = entry.split(':');
      const name = rawName?.trim();
      const type = rawType?.trim();

      if (!name || !type) {
        throw new Error(`Invalid field definition "${entry}". Expected name:type.`);
      }

      if (!isSupportedFieldType(type)) {
        throw new Error(
          `Unsupported field type "${type}" for "${name}". Supported types: string, number, boolean, Date.`
        );
      }

      return { name, type };
    });
}

function isSupportedFieldType(type: string): type is SupportedFieldType {
  return type === 'string' || type === 'number' || type === 'boolean' || type === 'Date';
}

function renderEntity(name: string, fields: FieldDefinition[]): string {
  const resourceName = pluralize(name);
  const fieldBlocks = fields
    .map((field) => {
      return [
        `  @Column({ type: '${TYPEORM_COLUMN_TYPES[field.type]}' })`,
        `  @Col({ label: '${capitalize(field.name)}' })`,
        `  ${field.name}!: ${field.type};`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    `import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';`,
    `import { Col, Resource } from '@faster-crud/core';`,
    ``,
    `@Entity()`,
    `@Resource('${resourceName}')`,
    `export class ${name} {`,
    `  @PrimaryGeneratedColumn()`,
    `  id!: number;`,
    ``,
    fieldBlocks,
    `}`,
    ``,
  ].join('\n');
}

function renderService(name: string): string {
  return [
    `import { Injectable } from '@nestjs/common';`,
    `import { InjectRepository } from '@nestjs/typeorm';`,
    `import { Repository } from 'typeorm';`,
    `import { TypeOrmResourceService } from '@faster-crud/typeorm';`,
    `import { ${name} } from './${name}.entity';`,
    ``,
    `@Injectable()`,
    `export class ${name}Service extends TypeOrmResourceService(${name}) {`,
    `  constructor(@InjectRepository(${name}) repo: Repository<${name}>) {`,
    `    super(repo);`,
    `  }`,
    `}`,
    ``,
  ].join('\n');
}

function renderModule(name: string): string {
  return [
    `import { Module } from '@nestjs/common';`,
    `import { TypeOrmModule } from '@nestjs/typeorm';`,
    `import { CrudControllerFactory } from '@faster-crud/nest';`,
    `import { ${name} } from './${name}.entity';`,
    `import { ${name}Service } from './${name}.service';`,
    ``,
    `const ${name}Controller = CrudControllerFactory.create(${name}, ${name}Service);`,
    ``,
    `@Module({`,
    `  imports: [TypeOrmModule.forFeature([${name}])],`,
    `  controllers: [${name}Controller],`,
    `  providers: [${name}Service],`,
    `  exports: [${name}Service],`,
    `})`,
    `export class ${name}Module {}`,
    ``,
  ].join('\n');
}

function pluralize(name: string): string {
  const lower = name.toLowerCase();
  return lower.endsWith('s') ? lower : `${lower}s`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function printUsageAndExit(message: string): never {
  console.error(message);
  console.error('Usage: fcrud add <Name> --fields "name:string,email:string" --outdir <path>');
  process.exit(1);
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}

module.exports = {
  main,
  parseArgs,
  parseFields,
  renderEntity,
  renderService,
  renderModule,
};
