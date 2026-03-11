declare module '@nestjs/common' {
  export interface ArgumentMetadata {
    type?: string;
    metatype?: unknown;
    data?: string;
  }

  export interface PipeTransform<T = unknown, R = unknown> {
    transform(value: T, metadata: ArgumentMetadata): R;
  }

  export class BadRequestException extends Error {
    constructor(response?: unknown);
  }
}
