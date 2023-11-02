import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, throwError, timeout } from 'rxjs';
import { DEFAULT_TIMEOUT_MS, TIMEOUT_KEY } from './interceptors.constants';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {

  constructor(private reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const timeout_ms = this.reflector.get<number>(TIMEOUT_KEY, context.getHandler()) || DEFAULT_TIMEOUT_MS;

    return next.handle().pipe(timeout(timeout_ms), catchError(
      err => {
        if (err.name === 'TimeoutError') {
          throwError(() => new RequestTimeoutException());
        }
        return throwError(() => new Error(err));
      }
    ));
  }
}
