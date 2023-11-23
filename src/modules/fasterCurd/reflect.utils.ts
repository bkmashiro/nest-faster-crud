export function getProtoMeta(target: { prototype: Object; }, field: any) {
  return Reflect.getMetadata(field, target.prototype)
}

export function setProtoMeta(target: { prototype: Object; }, field: any, value: any) {
  return Reflect.defineMetadata(field, value, target.prototype)
}
export function getProtoMetaKeys(target: { prototype: Object; }) {
  return Reflect.getMetadataKeys(target.prototype)
}