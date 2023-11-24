export type Point2D = {
  type: 'Point'
  coordinates: [number, number]
}

export function createPoint2D(data: { longitude: number; latitude: number }) {
  return {
    type: 'Point',
    coordinates: [data.longitude, data.latitude],
  } as Point2D
}

export function sub(a: Point2D, b: Point2D) {
  return {
    type: 'Point',
    coordinates: [
      a.coordinates[0] - b.coordinates[0],
      a.coordinates[1] - b.coordinates[1],
    ],
  } as Point2D
}

export function add(a: Point2D, b: Point2D) {
  return {
    type: 'Point',
    coordinates: [
      a.coordinates[0] + b.coordinates[0],
      a.coordinates[1] + b.coordinates[1],
    ],
  } as Point2D
}

export function distance(a: Point2D, b: Point2D) {
  return Math.sqrt(
    Math.pow(a.coordinates[0] - b.coordinates[0], 2) +
      Math.pow(a.coordinates[1] - b.coordinates[1], 2)
  )
}

export function scale(a: Point2D, s: number) {
  return {
    type: 'Point',
    coordinates: [a.coordinates[0] * s, a.coordinates[1] * s],
  } as Point2D
}

export function normalize(a: Point2D) {
  const d = Math.sqrt(
    Math.pow(a.coordinates[0], 2) + Math.pow(a.coordinates[1], 2)
  )
  return {
    type: 'Point',
    coordinates: [a.coordinates[0] / d, a.coordinates[1] / d],
  } as Point2D
}

export function dot(a: Point2D, b: Point2D) {
  return (
    a.coordinates[0] * b.coordinates[0] + a.coordinates[1] * b.coordinates[1]
  )
}

export function cross(a: Point2D, b: Point2D) {
  return (
    a.coordinates[0] * b.coordinates[1] - a.coordinates[1] * b.coordinates[0]
  )
}

export function rotate(a: Point2D, angle: number) {
  return {
    type: 'Point',
    coordinates: [
      a.coordinates[0] * Math.cos(angle) - a.coordinates[1] * Math.sin(angle),
      a.coordinates[0] * Math.sin(angle) + a.coordinates[1] * Math.cos(angle),
    ],
  } as Point2D
}

export function angle(a: Point2D, b: Point2D) {
  return Math.acos(dot(a, b) / (norm(a) * norm(b)))
}

export function norm(a: Point2D) {
  return Math.sqrt(
    Math.pow(a.coordinates[0], 2) + Math.pow(a.coordinates[1], 2)
  )
}

export function norm2(a: Point2D) {
  return Math.pow(a.coordinates[0], 2) + Math.pow(a.coordinates[1], 2)
}

export function toVector(a: Point2D) {
  return {
    x: a.coordinates[0],
    y: a.coordinates[1],
  }
}

export function fromVector(a: { x: number; y: number }) {
  return {
    type: 'Point',
    coordinates: [a.x, a.y],
  } as Point2D
}

export function toPoint2D(a: Point2D) {
  return {
    longitude: a.coordinates[0],
    latitude: a.coordinates[1],
  }
}

export function fromPoint2D(a: { longitude: number; latitude: number }) {
  return {
    type: 'Point',
    coordinates: [a.longitude, a.latitude],
  } as Point2D
}
