import type { List } from "@tsplus/stdlib/collections/List"
import type * as P from "@tsplus/stdlib/prelude/Covariant"
import * as H from "@tsplus/stdlib/prelude/HKT"
import type { Unfolder } from "@tsplus/stdlib/prelude/Recursive"
import { Recursive } from "@tsplus/stdlib/prelude/Recursive"

export namespace ListF {
  export type ListF<E, A> = Cons<E, A> | Nill
  export interface ListFHKT extends H.HKT {
    readonly type: ListF<this["E"], this["A"]>
  }
  export type HKT = ListFHKT

  class Cons<E, A> {
    readonly _tag = "cons"
    constructor(readonly head: E, readonly tail: A) {}
  }
  class Nill {
    readonly _tag = "nill"
    static nil = () => new Nill()
    constructor() {
      return this
    }
  }
  // constructors
  export const nil = Nill.nil
  export const cons = <E, A>(head: E, tail: A) => new Cons(head, tail)

  // typeclass
  export const Covariant = H.HKT.instance<P.Covariant<ListFHKT>>({
    map: (f) =>
      (fa) =>
        Match.tag(fa, {
          "nill": () => fa as any,
          "cons": (node) => new Cons(node.head, f(node.tail))
        })
  })
  // Project a `List<E>` into a  ListF<E, E>
  export function project<E>(): Unfolder.Fn<HKT, List<E>, E> {
    return (list) =>
      list.head.fold(
        () => nil() as any,
        (e) => cons(e, list.tail.fold(nil, identity))
      )
  }
  export const fromList = Recursive.unfold(
    Covariant,
    project()
  )

  export const fold = <Z, E>(fn: Recursive.Fn<HKT, Z, E>) => Recursive.$.fold(Covariant, fn)
  export const unfold = <Z, E>(fn: Unfolder.Fn<HKT, Z, E>) => Recursive.unfold(Covariant, fn)
}
