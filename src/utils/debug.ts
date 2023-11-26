let debug = false

export function setDebug(value: boolean) {
  debug = value
}

export function log(...args: any[]) {
  if (debug) {
    console.log(...args)
  }
}