export { NestCrudModule } from './nest-crud.module';
export { CrudControllerFactory } from './controller.factory';
export { ResourceService } from './resource.service';
export { buildDto, hasClassValidator, shouldUseDtoMetatype } from './dto.factory';
export { applySwaggerToController, applySwaggerToField, isSwaggerAvailable } from './swagger';
export type { IResourceService, IBaseResourceService } from './resource.service';
export type { ResourceRegistration } from './nest-crud.module';
