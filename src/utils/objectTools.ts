type ObjectWithNullableProps<T> = {
  [K in keyof T]: T[K] | null;
};

export function deconstrcuOrNull<T>(obj: T): ObjectWithNullableProps<T> {
  const result: ObjectWithNullableProps<T> = {} as ObjectWithNullableProps<T>;

  Object.keys(obj).forEach((key) => {
    result[key as keyof T] = obj[key as keyof T] ?? null;
  });

  return result;
}