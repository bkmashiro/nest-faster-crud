import 'reflect-metadata'
import {
  BEFORE_ACTION_TOKEN,
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

export function CRUD<T extends ClassType>(options: Partial<CURDOptions> = {}) {
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

export type BeforeActionOptions<T> = {
  requires: (keyof T)[]
  expect: (data: T) => boolean | ((data: T) => boolean)[]
  transform: (data: T) => T
}

export type ClassType = { new (...args: any[]): {} }
type PartialBeforeActionOptions<T extends ClassType> = Partial<
  BeforeActionOptions<InstanceType<T>>
>

export function BeforeAction<T extends ClassType>(
  action: CRUDMethods,
  options: PartialBeforeActionOptions<T> = {}
) {
  return function classDecorator(target: T) {
    mergeProtoMeta(target, BEFORE_ACTION_TOKEN, { [action]: options })
  }
}

export function Create<T extends ClassType>(
  options: PartialBeforeActionOptions<T> = {}
) {
  return BeforeAction('create', options)
}

export function Read<T extends ClassType>(
  options: PartialBeforeActionOptions<T> = {}
) {
  return BeforeAction('read', options)
}

export function Update<T extends ClassType>(
  options: PartialBeforeActionOptions<T> = {}
) {
  return BeforeAction('update', options)
}

export function Delete<T extends ClassType>(
  options: PartialBeforeActionOptions<T> = {}
) {
  return BeforeAction('delete', options)
}

export function IgnoreField<T extends ClassType>(
  li: (keyof InstanceType<T>)[]
) {
  return (target: T) => setProtoMeta(target, IGNORE_FIEIDS_TOKEN, li)
}

export type FieldOptions = {}
