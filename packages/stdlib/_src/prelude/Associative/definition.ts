/**
 * The `Associative<A>` type class describes an associative binary operator
 * for a type `A`. For example, addition for integers, and string
 * concatenation for strings.
 *
 * @tsplus type Associative
 */
export interface Associative<A> extends Closure<A> {
  readonly Law: Closure<A>["Law"] & { readonly Associative: "Associative" }
}

/**
 * @tsplus type Associative/Ops
 */
export interface AssociativeOps {
  <A>(combine: (x: A, y: A) => A): Associative<A>
}
export const Associative: AssociativeOps = <A>(combine: (x: A, y: A) => A): Associative<A> =>
  HKT.instance({ combine })

/**
 * @tsplus derive Associative[ImmutableArray]<_> 10
 */
export function deriveArray<A extends ImmutableArray<any>>(): Associative<A> {
  const assoc = ImmutableArray.getAssociative()
  return Associative<A>((x, y) => assoc.combine(x, y) as A)
}

/**
 * @tsplus derive Associative[Maybe]<_> 10
 */
export function deriveMaybe<A extends Maybe<any>>(
  ...[element]: [A] extends [Maybe<infer _A>] ? [element: Associative<_A>]
    : never
): Associative<A> {
  const assoc = Maybe.getAssociative(element)
  return Associative<A>((x, y) => assoc.combine(x, y) as A)
}
/**
 * @tsplus derive Associative[Either]<_> 10
 */
export function deriveEither<A extends Either<any, any>>(
  ...[element]: [A] extends [Either<infer _E, infer _A>] ? [element: Associative<_A>]
    : never
): Associative<A> {
  const assoc = Either.getAssociative(element)
  return Associative<A>((x, y) => assoc.combine(x, y) as A)
}

/**
 * @tsplus derive Associative[HashMap]<_> 10
 */
export function deriveHashMap<A extends HashMap<any, any>>(
  ...[element]: [A] extends [HashMap<infer _K, infer _V>] ? [element: Associative<_V>]
    : never
): Associative<A> {
  const assoc = HashMap.getAssociative(element)
  return Associative<A>((x, y) => assoc.combine(x, y) as A)
}
