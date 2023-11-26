export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Note that this will capture the stack trace of the caller
 * @param actionFactory 
 * @param ms 
 * @returns 
 */
export function timeout<T>(actionFactory: () => Promise<T>, ms: number): Promise<T> {
  const stackTrace = new Error().stack;  // This is used for better debugging
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms at \n ${stackTrace}`))
    }, ms)
    actionFactory().then((result) => {
      resolve(result)
    }).catch((err) => {
      reject(err)
    })
  })
}

export function timeoutWith<T>(actionFactory: () => Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(fallback)
    }, ms)
    actionFactory().then((result) => {
      resolve(result)
    }).catch((err) => {
      reject(err)
    })
  })
}

export function asPromise<T>(actionFactory: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      resolve(actionFactory())
    } catch (err) {
      reject(err)
    }
  })
}

export function backOff<T>(actionFactory:() => Promise<T>, ms: number, maxRetries: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const retry = () => {
      const action = actionFactory()
      action.then((result) => {
        resolve(result)
      }).catch((err) => {
        if (retries < maxRetries) {
          retries++;
          setTimeout(() => {
            console.log('retrying')
            retry()
          }, ms *= 2) // exponential backoff
        } else {
          reject(err)
        }
      })
    }
    retry()
    console.log('backoff started')
  })
}

export class TimeoutError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class MaxBackOffError extends Error {
  constructor(inner?: Error) { 
    super();
    this.name = "MaxBackOffError";
  }
}

export function NOT_IMPLEMENTED() {
  throw new Error('Not implemented')
}

export function isEmptyObject(obj: any) {
  return Object.keys(obj).length === 0
}
export function isArrayOfFunctions(
  data: any
): data is ((data: any) => boolean)[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'function')
}export function fixRoute(route: string) {
  if (route.startsWith('/')) {
    return route
  } else {
    return `/${route}`
  }
}
export type ClassType<T extends abstract new (...args: any) => any> = {
  new(...args: any[]): InstanceType<T>
}

