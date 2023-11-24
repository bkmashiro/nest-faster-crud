export const ENTITY_NAME_TOKEN = 'entity-name'
export const FIELDS_TOKEN = 'fields'
export const GEN_CRUD_METHOD_TOKEN = 'gen-crud-method'
export const IGNORE_FIEIDS_TOKEN = 'ignore-fields'
export type HttpMethods = 'get' | 'post' | 'put' | 'delete' | 'patch'
export type CRUDMethods = 'create' | 'read' | 'update' | 'delete'
export const BEFORE_ACTION_TOKEN = 'before-action'
export type BeforeActionTokenType = `before-action-${CRUDMethods}`
export const defaultCrudMethod = ['create', 'read', 'update', 'delete']