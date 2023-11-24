import { ConfigCtx } from './decorators'
import { isArrayOfFunctions } from './fasterCRUD'
import validatorMap from './defaultValidators'
import { AnyError } from 'typeorm'

export function shape_checker({ options }: ConfigCtx) {
  const { rawInput } = options
  let check_shape = (data: any) => data as any
  if (!rawInput) {
    check_shape = (data: any) => {
      if (!data.hasOwnProperty('data')) {
        throw new Error(`data not found, wrong input format`)
      }
    }
  }
  return check_shape
}

export function pagination_checker({ options }: ConfigCtx) {
  let check_pagination = (_: any) => void 0
  const { pagination } = options
  if (pagination) {
    check_pagination = (data: any) => {
      // check if pagination is exist
      if (!data.hasOwnProperty('pagination')) {
        throw new Error(`pagination not found for paginated query`)
      }

      // check if pagination is valid
      const { currentPage, pageSize } = data['pagination'] // currentPage is not checked here
      if (
        !currentPage ||
        !pageSize ||
        Number.isNaN(pageSize) ||
        Number.isNaN(currentPage) ||
        currentPage < 0 ||
        pageSize <= 0
      ) {
        throw new Error(`invalid pagination`)
      }

      const [min, max] = [
        pagination.min ?? 0,
        pagination.max, //this must be defined
      ]
      if (pageSize < min || pageSize > max) {
        throw new Error(`pageSize out of range`)
      }
    }
  }
  return check_pagination
}

export function except_checker({ options }: ConfigCtx) {
  const { expect } = options
  let check_expect = (data: any) => void 0
  if (expect) {
    if (isArrayOfFunctions(expect)) {
      check_expect = (data: any) => {
        for (const func of expect) {
          if (!func(data)) {
            throw new Error(`Expectation failed`)
          }
        }
      }
    } else if (typeof expect === 'function') {
      //TODO check if this is correct
      check_expect = (data: any) => {
        if (!expect(data)) {
          throw new Error(`Expectation failed`)
        }
      }
    } else {
      throw new Error(`Expect must be a function or array of functions`)
    }
  }
  return check_expect
}

export function requrie_checker({ options }: ConfigCtx) {
  const { requires } = options
  let check_requirements = (data: any) => void 0
  if (requires && Array.isArray(requires) && requires.length > 0) {
    check_requirements = (data: any) => {
      for (const field of requires) {
        if (!data.hasOwnProperty(field)) {
          throw new Error(`Missing field ${String(field)}`)
        }
      }
    }
  }
  return check_requirements
}

export function deny_checker({ options }: ConfigCtx) {
  const { denies } = options
  let check_requirements = (data: any) => void 0
  if (denies && Array.isArray(denies) && denies.length > 0) {
    check_requirements = (data: any) => {
      for (const field of denies) {
        if (data.hasOwnProperty(field)) {
          throw new Error(`Denied field ${String(field)}`)
        }
      }
    }
  }
  return check_requirements
}

export function exactly_checker({ options }: ConfigCtx) {
  const { exactly } = options
  let check_requirements = (data: any) => void 0
  if (exactly && Array.isArray(exactly) && exactly.length > 0) {
    check_requirements = (data: any) => {
      for (const field of exactly) {
        if (!data.hasOwnProperty(field)) {
          throw new Error(`Missing field ${String(field)}`)
        }
      }
      for (const field in data) {
        if (!exactly.includes(field)) {
          throw new Error(`Unexpected field ${String(field)}`)
        }
      }
    }
  }
  return check_requirements
}

export function type_checker({ options, fields }: ConfigCtx) {
  const { checkType } = options
  let check_requirements = (data: AnyError) => void 0
  if (checkType) {
    check_requirements = (data: any) => {
      for (const [key, f] of Object.entries(fields)) {
        const val = data[key]
        const validator: ((x: any) => boolean) | null =
          f.validator || validatorMap[f.type]
        if (!f.noCheck && validator) {
          if (validator(val)) {
            // all good
          } else {
            throw new Error(`assertion failed for asserted key ${key}`)
          }
        } else {
          if (!f.noCheck) {
            throw new Error(
              `missing validator for checked type ${f.type} (named ${key})`
            )
          }
        }
      }
    }
  }
  return check_requirements
}

export function transform_return_processor({ options }: ConfigCtx) {
  const { transformReturn } = options
  let transform_data = (data: any) => data
  if (transformReturn) {
    //TODO add check for function
    transform_data = transformReturn
  }
  return transform_data
}

export function pre_transform_processor({ options }: ConfigCtx) {
  const { transform } = options
  let transform_data = (data: any) => data
  if (transform) {
    //TODO add check for function
    transform_data = transform
  }
  return transform_data
}

export function pagination_transformer({ options }: ConfigCtx) {
  const { pagination, rawInput } = options
  if (rawInput) {
    return (data: any) => data
  }

  let transform_pagination = (data: {
    data: any
    pagination?: {
      currentPage: number
      pageSize: number
    }
  }) => {
    return {
      data: data.data,
    }
  }
  if (pagination) {
    // add skip and limit to data
    transform_pagination = (data: {
      data: any
      pagination?: {
        currentPage: number
        pageSize: number
      }
    }) => {
      if (!data.hasOwnProperty('pagination')) {
        throw new Error(`pagination not found for paginated query`)
      }

      const { currentPage, pageSize } = data['pagination'] // all start from 0
      const skip = currentPage * pageSize
      const take = pageSize
      return {
        data: data.data,
        skip,
        take,
      }
    }
  }
  return transform_pagination
}

export const checker_factories = [
  shape_checker,
  requrie_checker,
  deny_checker,
  except_checker,
  exactly_checker,
  pagination_checker,
  type_checker,
]

export const pre_transformer_factories = [
  pre_transform_processor,
  pagination_transformer,
  transform_return_processor,
]

export const post_transformer_factories = [transform_return_processor]
