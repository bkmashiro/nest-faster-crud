import 'reflect-metadata'
import {
  BEFORE_ACTION_TOKEN,
  BeforeActionTokenType,
  FCRUD_NAME_TOKEN,
  FIELD_TOKEN,
  GEN_CRUD_METHOD_TOKEN,
  IGNORE_FIEIDS_TOKEN,
} from './fcrud-tokens'
import {
  getProtoMeta,
  getProtoMetaKeys,
  mergeProtoMeta,
  setProtoMeta,
} from './reflect.utils'
import { CRUDMethods } from './fcrud-tokens'

interface FieldMetadata {
  name: string
  type: string
}

export function Field({
  name,
  type,
}: { name?: string; type?: string } = {}): PropertyDecorator {
  return function (target: any, key: string) {
    const _type_constructor = Reflect.getMetadata('design:type', target, key)
    const _value = target[key]
    const _name = key
    // const _key = Symbol(key);

    name = name || _name
    type = type || _type_constructor.name
    const existingMetadata =
      Reflect.getMetadata(IGNORE_FIEIDS_TOKEN, target) || {}
    const options = {
      name,
      type,
    }
    Reflect.defineMetadata(
      IGNORE_FIEIDS_TOKEN,
      Object.assign(existingMetadata, { [name]: options }),
      target
    )
  }
}

export type CURDOptions = {
  name: string
  methods: CRUDMethods[]
}

export function CRUD<T extends ClassType<T>>(
  options: Partial<CURDOptions> = {}
) {
  return function classDecorator(target: T) {
    const properties = getProtoMetaKeys(target)
    const fields: FieldMetadata[] = []
    const li = getProtoMeta(target, IGNORE_FIEIDS_TOKEN) || {}
    setProtoMeta(target, FCRUD_NAME_TOKEN, options.name)
    setProtoMeta(target, GEN_CRUD_METHOD_TOKEN, options.methods)

    for (const property of properties) {
      if (!li.hasOwnProperty(property)) {
        const metadata = getProtoMeta(target, property)
        if (metadata && metadata.name && metadata.type) {
          fields.push({
            name: metadata.name,
            type: metadata.type,
          })
        }
      }
    }
  }
}

export type BeforeActionOptions<T extends {}> = {
  requires: (keyof T)[]
  denies: (keyof T)[]
  exactly: (keyof T)[]
  expect: (data: T) => boolean | ((data: T) => boolean)[]
  transform: (data: T) => T
  transformReturn: (data: T) => any
  onSuccess: (data: T) => any
  onCheckFailure: (data: T) => any
  onTransformFailure: (data: T) => any
  onExecFailure: (data: T) => any
}

export type ClassType<T extends abstract new (...args: any) => any> = {
  new (...args: any[]): InstanceType<T>
}
type PartialBeforeActionOptions<T extends ClassType<T>> = Partial<
  BeforeActionOptions<InstanceType<T>>
>

export function BeforeAction<
  T extends { new (...args: any[]): InstanceType<T> }
>(action: CRUDMethods, options: PartialBeforeActionOptions<T> = {}) {
  return function classDecorator(target: T) {
    const token: BeforeActionTokenType = `before-action-${action}`
    setProtoMeta(target, token, options)
  }
}

export function Create<T extends ClassType<T>>(
  options: PartialBeforeActionOptions<T> = {}
) {
  return BeforeAction<T>('create', options)
}

export function Read<T extends ClassType<T>>(
  options: PartialBeforeActionOptions<T> = {}
) {
  return BeforeAction<T>('read', options)
}

export function Update<T extends ClassType<T>>(
  options: PartialBeforeActionOptions<T> = {}
) {
  return BeforeAction<T>('update', options)
}

export function Delete<T extends ClassType<T>>(
  options: PartialBeforeActionOptions<T> = {}
) {
  return BeforeAction<T>('delete', options)
}

export function IgnoreField<
  T extends { new (...args: any[]): InstanceType<T> }
>(li: (keyof InstanceType<T>)[]) {
  return (target: T) => Reflect.defineMetadata(IGNORE_FIEIDS_TOKEN, li, target)
}

export type FieldOptions = {}
