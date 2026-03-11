import { BadRequestException, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import { validateEntity, type ValidationError, type ValidationRules } from './index';

export interface ValidationPipeOptions {
  exceptionFactory?: (errors: ValidationError[]) => unknown;
  rules?: ValidationRules;
}

export class ValidationPipe implements PipeTransform {
  constructor(
    private readonly Entity: Function,
    private readonly options: ValidationPipeOptions = {},
  ) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const errors = validateEntity(asRecord(value), this.Entity, this.options.rules);
    if (errors.length === 0) {
      return value;
    }

    const exceptionFactory = this.options.exceptionFactory ?? defaultExceptionFactory;
    throw exceptionFactory(errors);
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return {};
}

function defaultExceptionFactory(errors: ValidationError[]): BadRequestException {
  return new BadRequestException(errors);
}
