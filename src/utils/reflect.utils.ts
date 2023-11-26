export function getProtoMeta(
  target: any,
  field: any,
  default_value = null
) {
  return Reflect.getMetadata(field, target.prototype) ?? default_value
}

export function mergeProtoMeta(
  target: any,
  field: any,
  value: any
) {
  let existingMetadata = getProtoMeta(target, field)

  if (typeof existingMetadata !== 'object') {
    throw new Error(`Cannot merge metadata for ${field} with ${value}`)
  }

  return Reflect.defineMetadata(
    field,
    Object.assign(existingMetadata ?? {}, value),
    target.prototype
  )
}

export function appendProtoMeta(
  target: { prototype: Object },
  field: any,
  value: any
) {
  let existingMetadata = getProtoMeta(target, field)

  if (!Array.isArray(existingMetadata)) {
    throw new Error(`Cannot append metadata for ${field} with ${value}`)
  }

  return Reflect.defineMetadata(
    field,
    [...existingMetadata, value],
    target.prototype
  )
}

export function setProtoMeta(
  target: any,
  field: any,
  value: any
) {
  return Reflect.defineMetadata(field, value, target.prototype)
}

export function getProtoMetaKeys(target: any) {
  return Reflect.getMetadataKeys(target.prototype)
}
