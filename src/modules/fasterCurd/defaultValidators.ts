export interface Validator {
  validate(x: any) : boolean
}

export default {
  String: (x: any) => typeof x === 'string',
  Number: (x: any) => typeof x === 'number',
}