import { FCRUD_GEN_CFG_TOKEN } from "../fcrud-tokens"

export type FastCrudFieldOptions = {
  name?: string
  title?: string
  type?: string
  column?: object
  form?: object
  search?: object
  dict?: object
}

export type GenerateFCOption = {}

export function FC(opt: Partial<FastCrudFieldOptions> = {}): PropertyDecorator {
  return function (target: any, key: string) {
    let { name, type } = opt
    const _type_constructor = Reflect.getMetadata('design:type', target, key)
    const _name = key
    name = name || _name
    type = type || _type_constructor.name //TODO add type mapping

    const newOption = Object.assign(opt, {
      name, type
    })

    const existingMetadata = Reflect.getMetadata(FCRUD_GEN_CFG_TOKEN, target) || {}
    Reflect.defineMetadata(
      FCRUD_GEN_CFG_TOKEN,
      Object.assign(existingMetadata, { [name]: newOption }),
      target
    )
  }
}

export function GenerateFCOption<T extends { new(...args: any[]): InstanceType<T> }>(
  options: Partial<GenerateFCOption> = {}
) {
  return function classDecorator(target: T) {
    const properties = Reflect.getMetadataKeys(target.prototype)
    const fields: { [key: string]: FastCrudFieldOptions } = {}

    for (const property of properties) {
      const metadata = Reflect.getMetadata(property, target.prototype)
      if (metadata && metadata.name && metadata.type) {
        fields[metadata.name] = {
          name: metadata.name,
          type: metadata.type,
        }
      }
    }
  }
}