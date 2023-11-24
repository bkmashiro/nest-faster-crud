import 'reflect-metadata'
import {
  BEFORE_ACTION_TOKEN,
  BeforeActionTokenType,
  ENTITY_NAME_TOKEN,
  FIELDS_TOKEN,
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

export type FieldOptions = {
  name: string
  type: string
  validator?: (x: any) => boolean
  noCheck?: boolean
}

export type FieldOptionsObject = {
  [key: string]: FieldOptions
}

export function Field(opt: Partial<FieldOptions> = {}): PropertyDecorator {
  return function (target: any, key: string) {
    let {
      name,
      type,
    } = opt
    const _type_constructor = Reflect.getMetadata('design:type', target, key)
    const _name = key
    // const _key = Symbol(key);

    name = name || _name
    type = type || _type_constructor.name
    const newOption = Object.assign(opt, {
      name, type
    })
    const existingMetadata = Reflect.getMetadata(FIELDS_TOKEN, target) || {}
    Reflect.defineMetadata(
      FIELDS_TOKEN,
      Object.assign(existingMetadata, { [name]: newOption }),
      target
    )
  }
}

// export function Field({
//   name,
//   type,
// }: { name?: string; type?: string } = {}): PropertyDecorator {
//   return function (target: any, key: string) {
//     const _type_constructor = Reflect.getMetadata('design:type', target, key)
//     const _value = target[key]
//     const _name = key
//     // const _key = Symbol(key);

//     name = name || _name
//     type = type || _type_constructor.name
//     const existingMetadata = Reflect.getMetadata('fields', target) || {}
//     const options = {
//       name,
//       type,
//     }
//     Reflect.defineMetadata(
//       'fields',
//       Object.assign(existingMetadata, { [name]: options }),
//       target
//     )
//   }
// }

export type CURDOptions = {
  name: string
  methods: CRUDMethods[]
}

// export function CRUD<T extends ClassType<T>>(
//   options: Partial<CURDOptions> = {}
// ) {
//   return function classDecorator(target: T) {
//     const properties = Reflect.getMetadataKeys(target.prototype)
//     let fields: { [key: string]: FieldMetadata } = {}
//     const li = getProtoMeta(target, IGNORE_FIEIDS_TOKEN) || {}
//     setProtoMeta(target, ENTITY_NAME_TOKEN, options.name)
//     setProtoMeta(target, GEN_CRUD_METHOD_TOKEN, options.methods)

//     for (const property of properties) {
//       if (!li.hasOwnProperty(property)) {
//         const metadata = Reflect.getMetadata(property, target.prototype)
//         if (metadata && metadata.name && metadata.type) {
//           console.log(`metadata`, metadata)
//           fields = Object.assign(fields, {
//             [metadata.name]: {
//               name: metadata.name,
//               type: metadata.type,
//             },
//           })
//         }
//       }
//     }
//     console.log(`fields`, fields)
//     setProtoMeta(target, FIELDS_TOKEN, fields)

//     Object.defineProperty(target, 'fields', {
//       value: fields,
//     })

//     console.log(`process done`, Reflect.getMetadata('fields', target.prototype))
//   }
// }

export function CRUD<T extends { new(...args: any[]): InstanceType<T> }>(
  options: Partial<CURDOptions> = {}
) {
  return function classDecorator(target: T) {
    const properties = Reflect.getMetadataKeys(target.prototype)
    const fields: { [key: string]: FieldOptions } = {}
    const li = Reflect.getMetadata('ignore', target.prototype) || []
    setProtoMeta(target, ENTITY_NAME_TOKEN, options.name)
    setProtoMeta(target, GEN_CRUD_METHOD_TOKEN, options.methods)
    // console.log(li)
    for (const property of properties) {
      if (!li.includes(property)) {
        const metadata = Reflect.getMetadata(property, target.prototype)
        if (metadata && metadata.name && metadata.type) {
          fields[metadata.name] = {
            name: metadata.name,
            type: metadata.type,
          }
        }
      }
    }

    // setProtoMeta(target, FIELDS_TOKEN, fields) //FIXME why this line mess things up 

    // Object.defineProperty(target, 'fields', {
    //   value: fields,
    // })

    // console.log(`process done`, Reflect.getMetadata('fields', target.prototype))
  }
}

export type BeforeActionOptions<T extends {}> = {
  checkType: boolean
  requires: (keyof T)[]
  denies: (keyof T)[]
  exactly: (keyof T)[]
  route: string
  expect: (data: T) => boolean | ((data: T) => boolean)[]
  transform: (data: T) => T
  transformReturn: (data: T) => any
  onSuccess: (data: T) => any
  onCheckFailure: (data: T) => any
  onTransformFailure: (data: T) => any
  onExecFailure: (data: T) => any
}

export type ClassType<T extends abstract new (...args: any) => any> = {
  new(...args: any[]): InstanceType<T>
}

export type PartialBeforeActionOptions<T extends ClassType<T>> = Partial<
  BeforeActionOptions<InstanceType<T>>
>

export type ConfigCtx<T extends ClassType<T>> = {
  options: PartialBeforeActionOptions<T>
  target: T
  fields: FieldOptionsObject
}

export function BeforeAction<
  T extends { new(...args: any[]): InstanceType<T> }
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
  T extends { new(...args: any[]): InstanceType<T> }
>(li: (keyof InstanceType<T>)[]) {
  return (target: T) => Reflect.defineMetadata(IGNORE_FIEIDS_TOKEN, li, target)
}

