/**
 * Array `Associative` for concatenation
 * @tsplus static Associative/Ops array
 */
export const immutableArray: Associative<ImmutableArray<any>> = Associative((x, y) => x.concat(y))
/** @tsplus implicit */
export const combineArray = immutableArray.combine
