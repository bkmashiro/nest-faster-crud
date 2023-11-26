import { ConfigCtx } from './decorators'
import { isArrayOfFunctions } from 'src/utils/utils'
import validatorMap from './defaultValidators'
import { FormReq, PageQuery } from './fastcrud-gen/interface'
import { CRUDMethods } from './fcrud-tokens'
import { isEmptyObject } from 'src/utils/utils'

export const IGNORE_ME = Symbol('ignore me')
export type PendingCheckerType = ((data: any) => void) | typeof IGNORE_ME
export type CheckerType = (data: any) => void
export type PendingTransformerType = ((data: any) => any) | typeof IGNORE_ME
export type TransformerType = (data: any) => any

const form_requests: CRUDMethods[] = ['create', 'update', 'delete']
const query_requests: CRUDMethods[] = ['read']
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
    check_pagination = ({ page }: PageQuery) => {
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

function sort_checker({ options }: ConfigCtx) {
  const { sort: default_sort } = options
  let check_sort: PendingCheckerType = IGNORE_ME
  if (default_sort) {
    check_sort = (query: PageQuery) => {
      const { sort } = query
      if (!sort || isEmptyObject(sort)) {
        query.sort = default_sort
      }
    }
  }
  return check_sort
}

function except_checker({ options }: ConfigCtx) {//TODO sync this with requrie_checker
  const { expect } = options
  let check_expect: PendingCheckerType = IGNORE_ME
  if (expect && Array.isArray(expect) && expect.length > 0) {
    check_expect = ({ form }: any) => {
      for (const field of expect) {
        if (form.hasOwnProperty(field)) {
          throw new Error(`Unexpected field ${String(field)}`)
        }
      }
    }
  } else if (expect instanceof RegExp) {
    check_expect = ({ form }: any) => {
      for (const field in form) {
        if (expect.test(field)) {
          throw new Error(`Unexpected field ${String(field)}`)
        }
      }
    }
  }
  return check_expect
}

function requrie_checker({ options, fields }: ConfigCtx) {
  const { requires } = options
  let check_requirements: PendingCheckerType = IGNORE_ME
  if (requires && Array.isArray(requires) && requires.length > 0) {
    check_requirements = ({ form }: any) => {
      for (const field of requires) {
        if (!form.hasOwnProperty(field)) {
          throw new Error(`Missing field ${String(field)} form`)
        }
      }
    }
  } else if (requires instanceof RegExp) {
    check_requirements = ({ form }: any) => {
      for (const [name, field] of Object.entries(fields)) {
        // console.log(name, field)
        if (
          requires.test(name) &&
          !form.hasOwnProperty(name) &&
          field.requires_override !== false // note that unset (undefined) is true
        ) {
          throw new Error(`Missing field ${String(name)} form`)
        }
      }
    }
  }
  return check_requirements
}

function deny_checker({ options }: ConfigCtx) { //TODO sync this with requrie_checker
  const { denies } = options
  let check_requirements: PendingCheckerType = IGNORE_ME
  if (denies && Array.isArray(denies) && denies.length > 0) {
    check_requirements = ({ form }: any) => {
      for (const field of denies) {
        if (form.hasOwnProperty(field)) {
          throw new Error(`Unexpected field ${String(field)}`)
        }
      }
    }
  } else if (denies instanceof RegExp) {
    check_requirements = ({ form }: any) => {
      for (const field in form) {
        if (denies.test(field)) {
          throw new Error(`Unexpected field ${String(field)}`)
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
          throw new Error(`Missing field ${String(field)} form`)
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
  const { transformQueryReturn } = options
  let transform_query_return: PendingTransformerType = IGNORE_ME
  if (transformQueryReturn) {
    //TODO add check for function
    transform_query_return = transformQueryReturn
  }
  return transform_query_return
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

// this is a special one
function transform_after_processor({ options, action }: ConfigCtx) {
  const { transformAfter } = options
  if (transformAfter) {
    // user's override, use it
    return transformAfter
  }
  let transform_after = (data: any, queryRet: any) => data

  if (form_requests.includes(action)) {
    // if Create, Update, Delete, then return form
    transform_after =  (data: any, queryRet: any) => {
      return data.form
    }
  }
  if (query_requests.includes(action)) {
    // if Read, then return records
    transform_after =  (data: any, transformedQueryRet: any) => {
      return transformedQueryRet
    }
  }
  
  return transform_after
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
  sort_checker,
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

export { transform_after_processor }
