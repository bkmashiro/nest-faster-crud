import 'reflect-metadata'

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
    const existingMetadata = Reflect.getMetadata('fields', target) || {}
    const options = {
      name,
      type,
    }
    Reflect.defineMetadata(
      'fields',
      Object.assign(existingMetadata, { [name]: options }),
      target
    )
  }
}

export function CRUD<T extends { new (...args: any[]): InstanceType<T> }>() {
  return function classDecorator(target: T) {
    const properties = Reflect.getMetadataKeys(target.prototype)
    const fields: FieldMetadata[] = []
    const li = Reflect.getMetadata('ignore', target.prototype) || []
    // console.log(li)
    for (const property of properties) {
      if (!li.includes(property)) {
        const metadata = Reflect.getMetadata(property, target.prototype)
        if (metadata && metadata.name && metadata.type) {
          fields.push({
            name: metadata.name,
            type: metadata.type,
          })
        }
      }
    }

    Object.defineProperty(target, 'fields', {
      value: fields,
    })

    // console.log(`process done`, Reflect.getMetadata('fields', target.prototype))
  }
}

export function IgnoreField<T extends { new (...args: any[]): InstanceType<T> }>(
  li: (keyof InstanceType<T>)[]
) {
  return (target: T) => Reflect.defineMetadata('ignore', li, target)
}


// 控制器装饰器工厂函数，用于生成动态控制器
function DynamicController(route: string, entity: { [key: string]: any }) {
  class DynamicControllerClass {}

  return DynamicControllerClass
}

export type FieldOptions = {}

@IgnoreField(['id'])
class TTT {
  id: number;

  @Field()
  public username: string;

  @Field()
  public email: string;
}
