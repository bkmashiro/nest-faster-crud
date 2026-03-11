import { DynamicModule, Module, Type } from '@nestjs/common';
import { CrudControllerFactory } from './controller.factory';

export interface ResourceRegistration {
  resource: Function;
  service: Type<any>;
}

@Module({})
export class NestCrudModule {
  static forFeature(registrations: ResourceRegistration[]): DynamicModule {
    const controllers = registrations.map(({ resource, service }) =>
      CrudControllerFactory.create(resource, service)
    );

    return {
      module: NestCrudModule,
      controllers,
      providers: registrations.map(r => r.service),
      exports:   registrations.map(r => r.service),
    };
  }
}
