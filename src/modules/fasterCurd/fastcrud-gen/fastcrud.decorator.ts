import { applyDecorators } from '@nestjs/common'
import { FCRUD_GEN_CFG_TOKEN } from '../fcrud-tokens'
import { Field, FieldOptions } from '../decorators'

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
const typeMapping = {
  String: 'string',
}
export function FC(opt: Partial<FastCrudFieldOptions> = {}): PropertyDecorator {
  return function (target: any, key: string) {
    let { name, type, title } = opt
    const _type_constructor = Reflect.getMetadata('design:type', target, key)
    const _name = key

    name = name || _name
    title = title || name
    type = type || typeMapping[_type_constructor.name] || _type_constructor.name

    const newOption = Object.assign(opt, {
      title,
      name,
      type,
    })

    const existingMetadata =
      Reflect.getMetadata(FCRUD_GEN_CFG_TOKEN, target) || {}
    Reflect.defineMetadata(
      FCRUD_GEN_CFG_TOKEN,
      Object.assign(existingMetadata, { [name]: newOption }),
      target
    )
  }
}

function PresetFC(
  preset_options: Partial<FastCrudFieldOptions>,
  remaining_options?: Partial<FastCrudFieldOptions>,
  field_options?: Partial<FieldOptions>
) {
  return applyDecorators(
    Field(field_options),
    FC(Object.assign(preset_options, remaining_options))
  )
}

export function GenerateFCOption<
  T extends { new (...args: any[]): InstanceType<T> }
>(options: Partial<GenerateFCOption> = {}) {
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

export namespace $ {
  type FC_type = 'text' | 'number' | 'dict-select' | 'date-picker'
  const _ = FC
  type ArgsType = FastCrudFieldOptions & Partial<FieldOptions>
  export const Text = (title?: string, args?: ArgsType) => {
    return PresetFC(
      {
        title,
        type: 'text',
      },
      args
    )
  }
  export const Number = (
    title?: string,
    fcargs?: FastCrudFieldOptions,
    field_options?: FieldOptions
  ) => {
    return PresetFC(
      {
        title,
        type: 'number',
      },
      fcargs,
      field_options
    )
  }
  export const DictSelect = (
    title?: string,
    fcargs?: FastCrudFieldOptions,
    field_options?: FieldOptions
  ) => {
    return PresetFC(
      {
        title,
        type: 'dict-select',
      },
      fcargs,
      field_options
    )
  }
  export const NumberDictSelect = (
    dictArr: string[],
    title?: string,
    fcargs?: FastCrudFieldOptions,
    field_options?: FieldOptions
  ) => {
    return PresetFC(
      {
        title,
        type: 'dict-select',
        dict: {
          data: dictArr.map((x, i) => ({ value: i, label: x })),
        },
      },
      fcargs,
      field_options
    )
  }
  export const DatePicker = (
    title?: string,
    fcargs?: FastCrudFieldOptions,
    field_options?: FieldOptions
  ) => {
    return PresetFC(
      {
        title,
        type: 'date-picker',
      },
      fcargs,
      field_options
    )
  }
}
