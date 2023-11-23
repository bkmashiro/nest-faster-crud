import 'reflect-metadata'
import { FCRUD_NAME_TOKEN, FIELD_TOKEN as FIELDS_TOKEN, GEN_CRUD_METHOD_TOKEN, IGNORE_FIEIDS_TOKEN } from './fcrud-tokens'
import { getProtoMeta, getProtoMetaKeys, setProtoMeta } from './reflect.utils'

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
    const existingMetadata = Reflect.getMetadata(IGNORE_FIEIDS_TOKEN, target) || {}
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

export type HttpMethods = 'get' | 'post' | 'put' | 'delete' | 'patch'
export type CRUDMethods = 'create' | 'read' | 'update' | 'delete'

export type CURDOptions = {
  name: string
  methods: CRUDMethods[]
}

export function CRUD<T extends { new (...args: any[]): InstanceType<T> }>(
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

export function IgnoreField<
  T extends { new (...args: any[]): InstanceType<T> }
>(li: (keyof InstanceType<T>)[]) {
  return (target: T) => setProtoMeta(target, IGNORE_FIEIDS_TOKEN, li)
}

export type FieldOptions = {}
