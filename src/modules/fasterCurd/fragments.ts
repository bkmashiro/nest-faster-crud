import { ConfigCtx } from './decorators'
import { isArrayOfFunctions } from './fasterCRUD'
import validatorMap from './defaultValidators'
import { FormReq, PageQuery } from './fastcrud-gen/interface'
import { CRUDMethods } from './fcrud-tokens'

export const IGNORE_ME = Symbol('ignore me')
export type PendingCheckerType = ((data: any) => void) | typeof IGNORE_ME
export type CheckerType = ((data: any) => void)
export type PendingTransformerType = ((data: any) => any) | typeof IGNORE_ME
export type TransformerType = ((data: any) => any)

const form_requests: CRUDMethods[] = ['create', 'update', 'delete']
function shape_checker({ options, action }: ConfigCtx) {
  const { rawInput } = options
  let check_shape: PendingCheckerType = IGNORE_ME
  if (!rawInput && form_requests.includes(action)) {
    check_shape = (data: any) => {
      if (!data.hasOwnProperty('form')) {
        throw new Error(`form not found, wrong input format`)
      }
    }
  }
  return check_shape
}

function pagination_checker({ options }: ConfigCtx) {
  let check_pagination: PendingCheckerType = IGNORE_ME
  const { pagination } = options
  if (pagination) {
    check_pagination = ({page}: PageQuery) => {
      // check if pagination is exist
      if (!page) {
        throw new Error(`pagination not found for paginated query`)
      }

      // check if pagination is valid
      const { currentPage, pageSize } = page // currentPage is not checked here
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

function except_checker({ options }: ConfigCtx) {
  const { expect } = options
  let check_expect: PendingCheckerType = IGNORE_ME
  if (expect) {
    if (isArrayOfFunctions(expect)) {
      check_expect = ({ form }: FormReq) => {
        for (const func of expect) {
          if (!func(form)) {
            throw new Error(`Expectation failed`)
          }
        }
      }
    } else if (typeof expect === 'function') {
      //TODO check if this is correct
      check_expect = ({ form }: FormReq) => {
        if (!expect(form)) {
          throw new Error(`Expectation failed`)
        }
      }
    } else {
      throw new Error(`Expect must be a function or array of functions`)
    }
  }
  return check_expect
}

function requrie_checker({ options }: ConfigCtx) {
  const { requires } = options
  let check_requirements: PendingCheckerType = IGNORE_ME
  if (requires && Array.isArray(requires) && requires.length > 0) {
    check_requirements = ({ form }: any) => {
      for (const field of requires) {
        if (!form.hasOwnProperty(field)) {
          throw new Error(
            `Missing field ${String(field)} form`
          )
        }
      }
    }
  } else if (requires instanceof RegExp) {
    check_requirements = ({ form }: any) => {
      for (const field in form) {
        if (!requires.test(field)) {
          throw new Error(`Unexpected field ${String(field)}`)
        }
      }
    }
  }
  return check_requirements
}

function deny_checker({ options }: ConfigCtx) {
  const { denies } = options
  let check_requirements: PendingCheckerType = IGNORE_ME
  if (denies && Array.isArray(denies) && denies.length > 0) {
    check_requirements = ({ form }: any) => {
      for (const field of denies) {
        if (form.hasOwnProperty(field)) {
          throw new Error(`Denied field ${String(field)}`)
        }
      }
    }
  } else if (denies instanceof RegExp) {
    check_requirements = ({ form }: any) => {
      for (const field in form) {
        if (denies.test(field)) {
          throw new Error(`Denied field ${String(field)}`)
        }
      }
    }
  }

  return check_requirements
}

function exactly_checker({ options }: ConfigCtx) {
  const { exactly } = options
  let check_requirements: PendingCheckerType = IGNORE_ME
  if (exactly && Array.isArray(exactly) && exactly.length > 0) {
    check_requirements = ({ form }: any) => {
      for (const field of exactly) {
        if (!form.hasOwnProperty(field)) {
          throw new Error(`Missing field ${String(field)}`)
        }
      }
      for (const field in form) {
        if (!exactly.includes(field)) {
          throw new Error(`Unexpected field ${String(field)}`)
        }
      }
    }
  }
  return check_requirements
}

function type_checker({ options, fields }: ConfigCtx) {
  const { checkType } = options
  let check_requirements: PendingCheckerType = IGNORE_ME
  if (checkType) {
    check_requirements = ({ form }: any) => {
      for (const [key, f] of Object.entries(fields)) {
        const val = form[key]
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

function transform_return_processor({ options }: ConfigCtx) {
  const { transformQueryReturn: transformReturn } = options
  let transform_data: PendingTransformerType = IGNORE_ME
  if (transformReturn) {
    //TODO add check for function
    transform_data = transformReturn
  }
  return transform_data
}

function pre_transform_processor({ options }: ConfigCtx) {
  const { transform } = options
  let transform_data: PendingTransformerType = IGNORE_ME
  if (transform) {
    //TODO add check for function
    transform_data = transform
  }
  return transform_data
}

// export function pagination_transformer({ options }: ConfigCtx) {
//   const { pagination, rawInput } = options
//   if (rawInput) {
//     return (data: any) => data
//   }

//   let transform_pagination = (data: PageQuery) => {
//     return {
//       form: data.form,
//     } as PageQuery
//   }
//   if (pagination) {
//     // add skip and limit to data
//     transform_pagination = (data: PageQuery) => {
//       if (!data.hasOwnProperty('page')) {
//         throw new Error(`pagination not found for paginated query`)
//       }

//       const { currentPage, pageSize } = data['page'] // all start from 0

//       return {
//         form: data.form,
//         page: {
//           currentPage,
//           pageSize,
//         }
//     }
//   }
//   return transform_pagination
// }

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
  // pagination_transformer,
]

export const post_transformer_factories = [transform_return_processor]
