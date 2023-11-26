export const fcrud_prefix = `fcrud:`
type fcrud_prefix_type = typeof fcrud_prefix
export const ENTITY_NAME_TOKEN = `${fcrud_prefix}entity-name` //TODO deprecate this
export const FIELDS_TOKEN = `${fcrud_prefix}fields` //TODO deprecate this
export const GEN_CRUD_METHOD_TOKEN = `${fcrud_prefix}gen-crud-method` //TODO deprecate this
export const GEN_DATA_DICT_TOKEN = `${fcrud_prefix}gen-data-dict` //TODO deprecate this
export const IGNORE_FIEIDS_TOKEN = `${fcrud_prefix}ignore-fields` //TODO deprecate this
export const CRUD_OPTION = `${fcrud_prefix}crud-option`
export type HttpMethods = `get` | `post` | `put` | `delete` | `patch`
export type CRUDMethods = `create` | `read` | `update` | `delete`
export const BEFORE_ACTION_TOKEN = `${fcrud_prefix}before-action`
export type BeforeActionTokenType =
  `${fcrud_prefix_type}before-action-${CRUDMethods}`
export const defaultCrudMethod = [`create`, `read`, `update`, `delete`]
export const FCRUD_GEN_CFG_TOKEN = `${fcrud_prefix}fast-crud-config-gen`
