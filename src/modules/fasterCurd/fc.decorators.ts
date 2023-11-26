import 'reflect-metadata'
import {
  BeforeActionTokenType,
  ENTITY_NAME_TOKEN,
  FIELDS_TOKEN,
  GEN_CRUD_METHOD_TOKEN,
  GEN_DATA_DICT_TOKEN,
  IGNORE_FIEIDS_TOKEN,
  fcrud_prefix,
} from './fc.tokens'
import { getProtoMeta, setProtoMeta } from '../../utils/reflect.utils'
import { CRUDMethods } from './fc.tokens'
import { FC } from './fastcrud-gen/fastcrud.decorator'
import { FastCrudFieldOptions } from './fastcrud-gen/fast-crud.decl'
import { applyDecorators } from '@nestjs/common'
import { ObjectLiteral } from "./fastcrud-gen/fast-crud.decl"

export type FieldOptions = Partial<{
  name: string
  type: string
  validator?: (x: any) => boolean
  noCheck?: boolean
  requires_override?: boolean
}>

export type FieldOptionsObject = {
  [key: string]: FieldOptions
}

export function Field(opt: FieldOptions = {}): PropertyDecorator {
  return function (target: any, key: string) {
    let { name, type } = opt
    const _type_constructor = Reflect.getMetadata('design:type', target, key)
    const _name = key
    // const _key = Symbol(key);

    name = name || _name
    type = type || _type_constructor.name
    const newOption = Object.assign(opt, {
      name,
      type,
    })
    const existingMetadata = Reflect.getMetadata(FIELDS_TOKEN, target) || {}
    Reflect.defineMetadata(
      FIELDS_TOKEN,
      Object.assign(existingMetadata, { [name]: newOption }),
      target
    )
  }
}

export function FieldFC(
  opt: Partial<FieldOptions & { fc: FastCrudFieldOptions }> = {}
) {
  return applyDecorators(Field(opt), FC(opt.fc))
}

export type CURDOptions = {
  name: string
  methods: CRUDMethods[]
  exposeDict: boolean
}

export function CRUD<T extends { new (...args: any[]): InstanceType<T> }>(
  options: Partial<CURDOptions> = {}
) {
  return function classDecorator(target: T) {
    const li = getProtoMeta(target, IGNORE_FIEIDS_TOKEN)
    const fields = getProtoMeta(target, FIELDS_TOKEN)
    // console.log(li)
    // console.log(fields)
    setProtoMeta(target, ENTITY_NAME_TOKEN, options.name)
    setProtoMeta(target, GEN_CRUD_METHOD_TOKEN, options.methods)
    setProtoMeta(target, GEN_DATA_DICT_TOKEN, options.exposeDict)
    // remove ignored fields
    if (li && Array.isArray(li) && fields) {
      for (const field of li) {
        delete fields[field]
      }
    }
    setProtoMeta(target, FIELDS_TOKEN, fields)
  }
}

export type FieldSelector<T> = (keyof T)[] | RegExp

export type BeforeActionOptions<T> = Partial<{
  /**
   * if enabled, the input data will not be transformed
   * that means, pagination, sort, etc. will not be parsed
   */
  rawInput: boolean
  pagination: {
    min?: number
    max: number
  }
  sort: {
    [prop in keyof T]?: 'ASC' | 'DESC'
  }
  allow_sort: FieldSelector<T>
  checkType: boolean
  requires: FieldSelector<T>
  denies: FieldSelector<T>
  exactly: (keyof T)[] // Not support regex
  route: string
  expect: ((data: T) => boolean) | ((data: T) => boolean)[]
  transform: (data: T) => T
  transformQueryReturn: (result: any) => any
  transformAfter: (data: { form: T }, queryRet: any) => any
  onSuccess: (data: T) => any
  onCheckFailure: (data: T) => any
  onTransformFailure: (data: T) => any
  onExecFailure: (data: T) => any
  ctx: object | null
}>

export type ClassType<T extends abstract new (...args: any) => any> = {
  new (...args: any[]): InstanceType<T>
}

export type ConfigCtx<T extends ObjectLiteral = any> = {
  options: BeforeActionOptions<T>
  target: T
  fields: FieldOptionsObject
  action: CRUDMethods
}

export function BeforeAction<
  T extends abstract new (...args: any) => InstanceType<T>
>(action: CRUDMethods, options: BeforeActionOptions<InstanceType<T>> = {}) {
  return function classDecorator(target: T) {
    const token: BeforeActionTokenType = `${fcrud_prefix}before-action-${action}`
    setProtoMeta(target, token, options)
  }
}

export function Create<T extends ClassType<T>>(
  options: BeforeActionOptions<InstanceType<T>> = {}
) {
  return BeforeAction<T>('create', options)
}

export function Read<T extends abstract new (...args: any) => InstanceType<T>>(
  options: BeforeActionOptions<InstanceType<T>> = {}
) {
  return BeforeAction<T>('read', options)
}

export function Update<T extends ClassType<T>>(
  options: BeforeActionOptions<InstanceType<T>> = {}
) {
  return BeforeAction<T>('update', options)
}

export function Delete<T extends ClassType<T>>(
  options: BeforeActionOptions<InstanceType<T>> = {}
) {
  return BeforeAction<T>('delete', options)
}

export function IgnoreField<
  T extends { new (...args: any[]): InstanceType<T> }
>(li: (keyof InstanceType<T>)[]) {
  return (target: T) => {
    setProtoMeta(target, IGNORE_FIEIDS_TOKEN, li)
  }
}
