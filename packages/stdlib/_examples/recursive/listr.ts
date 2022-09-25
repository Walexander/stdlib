import type * as P from "@tsplus/stdlib/prelude/Covariant"
import type { Unfolder } from "@tsplus/stdlib/prelude/Recursive"
// Type definitions
export type RList<A> = Nil<A> | Node<A>
export type Carrier<A> = Tuple<[A, A]>
export interface RListF extends HKT {
  readonly type: RList<this["A"]>
}

export const Functor: Covariant<RListF> = HKT.instance<P.Covariant<RListF>>({
  map: (f) => (fa) => fa.map(f)
})
export class Nil<A> {
  readonly _tag = "nil"
  readonly "_A": A
  constructor() {
    return this
  }
  map<B>(_: (a: A) => B): RList<B> {
    return this as any
  }
}
export class Node<A> {
  readonly _tag = "node"
  readonly "_A": A
  constructor(readonly head: Carrier<string>, readonly tail: A) {}
  map<B>(f: (r: A) => B): RList<B> {
    return new Node(this.head, f(this.tail))
  }
}
export function substrings(s0: string): Unfolder.Fn<RListF, Carrier<string>> {
  return ({ tuple: [s, t] }) => {
    const [, ...ss] = s
    const [, ...ts] = t
    switch (s.length) {
      case 0:
        return t.length == 0 ?
          new Nil() :
          new Node(Tuple("", t), Tuple(s0, ts.join("")))
      default:
        return new Node(Tuple(s, t), Tuple(ss.join(""), t))
    }
  }
}

export const suffixes: Unfolder.Fn<RListF, string> = (curr) => {
  const [a, ...rest] = curr
  if (curr.length == 0 || !a) {
    return new Nil()
  }
  return new Node(Tuple(a, ""), rest.join(""))
}
