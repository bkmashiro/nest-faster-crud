import 'reflect-metadata'

// 定义一个接口来表示字段的元数据
interface FieldMetadata {
  name: string;
  type: string;
}


function classDecorator<T extends { new(...args: any[]): {} }>(constructor: T) {
  console.log()
}

function classDecorator2<T extends { new(...args: any[]): {} }>(li: keyof T) {
  return classDecorator
}

interface ClassType<T> {
  new (...args: any[]): T;
}

function classType<T>(target: ClassType<T>) {
  // 这里可以添加一些额外的逻辑
  return target;
}

function classType2<T extends {new(...args:any[]):{}}>(ignore: string[]) {
  // 这里可以添加一些额外的逻辑
  return function classType<T>(target) {
    return target;
  }
}


type PropertyType<T, K extends keyof T, D> = K extends keyof T ? T[K] : D;

// 定义一个装饰器工厂函数，用于创建类装饰器
function CollectFields<T>(ignores: any[] = []): ClassDecorator {
  return function (target: any) {
    // 获取所有属性的装饰器元数据
    const properties = Reflect.getMetadataKeys(target.prototype);

    // 存储字段元数据的数组
    const fields: FieldMetadata[] = [];

    // 遍历每个属性，收集字段信息
    for (const property of properties) {
      const metadata = Reflect.getMetadata(property, target.prototype);
      if (metadata && metadata.name && metadata.type) {
        fields.push({
          name: metadata.name,
          type: metadata.type,
        });
      }
    }

    // 将字段信息存储在静态变量中
    target.fields = fields;
  };
}

// 定义一个属性装饰器，用于为属性添加元数据
function Field(name: string, type: string): PropertyDecorator {
  return function (target: any, key: string) {
    // 将元数据添加到属性上
    Reflect.defineMetadata(key, { name, type }, target);
  };
}

// 使用装饰器和元数据
// @CollectFields(['i'])
@classType2(['id'])
class User {
  @Field('id', 'uuid')
  public id: string;

  @Field('username', 'string')
  public username: string;

  @Field('email', 'string')
  public email: string;
}

// 访问生成的字段信息
// @ts-ignore
console.log(User.fields);
