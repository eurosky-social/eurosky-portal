/**
 * Turn a type into a JSON compatible type.
 */
export type Jsonify<T> = T extends boolean | number | string | null | undefined
  ? T
  : { [Key in keyof T]: Jsonify<T[Key]> }
