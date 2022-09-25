import { ImmutableArray } from "@tsplus/stdlib/collections/ImmutableArray"
import type * as P from "@tsplus/stdlib/prelude/Covariant"
import * as H from "@tsplus/stdlib/prelude/HKT"
import type { Unfolder } from "@tsplus/stdlib/prelude/Recursive"
import { Recursive } from "@tsplus/stdlib/prelude/Recursive"

export namespace List {
  type List<A> = Cons<A> | Nil
  type Nil = null
  type Cons<A> = { head: A; tail: List<A> }
  export const cons = <A>(head: A, tail: List<A>): List<A> => ({ head, tail })
  export const length = <A>(list: List<A>): number => list == null ? 0 : 1 + length(list.tail)
}
export namespace ListF {
  export type ListF<E, A> = ConsR<E, A> | NillF
  export type NillF = null
  export type ConsR<E, A> = { head: E; tail: A }
  export interface HKT extends H.HKT {
    readonly type: ListF<this["E"], this["A"]>
  }
  const make = <E, A>(head: E, tail: A): ListF<E, A> => ({
    head,
    tail
  })
  export const cons = <E>(head: E, tail: Recursive<HKT, E>) => make(head, tail)
  export const Covariant = H.HKT.instance<P.Covariant<HKT>>({
    map: (f) =>
      (fa) => (fa == null ? fa as any : {
        head: fa.head,
        tail: f(fa.tail)
      })
  })
  export const one = make(1, null)
  export const twoOne = make(2, one)
  export const threeTwoOne = make(3, twoOne)
}
namespace BinTree {
  type Tip = null
  type Leaf<A, R> = Tuple<[R, A, R]>
  type BinTree<A, R> = Tip | Leaf<A, R>
  export interface BinTreeF extends HKT {
    readonly type: BinTree<this["R"], this["A"]>
  }
  export const tree = <A, R>(left: R, value: A, right: R) => Tuple(left, value, right)
  export const left = <A, R>(tree: Leaf<A, R>) => tree.get(0)
  export const right = <A, R>(tree: Leaf<A, R>) => tree.get(2)
  export const value = <A, R>(tree: Leaf<A, R>) => tree.get(1)
  export const Covariant = HKT.instance<P.Covariant<BinTreeF>>({
    map: (f) =>
      (self) =>
        self &&
          tree(
            f(left(self)),
            value(self),
            f(right(self))
          ) || null
  })
}
/**
 * @tsplus static HashMap.Aspects upsert
 * @tsplus pipeable HashMap upsert
 */
export function upsert<K, V>(key: K, value: V, update: (v: V) => V) {
  return (self: HashMap<K, V>) =>
    self.get(key).fold(
      () => self.set(key, value),
      (v) => self.set(key, update(v))
    )
}
/**
 * @tsplus static Chunk.Aspects groupWith
 * @tsplus pipeable Chunk groupWith
 */
export function groupWith<A, B>(
  contramap: (a: A) => B
): (as: Chunk<A>) => Chunk<Chunk<A>> {
  const reducer = (accum: HashMap<B, Chunk<A>>, a: A) =>
    pipe(
      contramap(a),
      (thisB) => accum.upsert(thisB, Chunk(a), Chunk.$.append(a))
    )
  return (as) =>
    pipe(
      as.reduce(HashMap.empty(), reducer),
      (a) => Chunk.from(a.values)
    )
}

export namespace Trie {
  type Trie<E, A> = Chunk<Tuple<[E, A]>>
  interface TrieF extends HKT {
    readonly type: Trie<this["E"], this["A"]>
  }
  export const Covariant = HKT.instance<P.Covariant<TrieF>>({
    map: (f) => (fa) => fa.map((tuple) => Tuple(tuple.get(0), f(tuple.get(1))))
  })

  export const count: Recursive.Fn<TrieF, number> = (trie) =>
    trie.foldMap(AssociativeIdentity.sum, (t) => 1 + t.get(1))
}

export namespace Trie2 {
  const M = HashMap
  const none = Maybe.none
  type Map<K, V> = HashMap<K, V>
  export type Trie<k, v> = Tuple<[Maybe<v>, Map<k, Trie<k, v>>]>
  type TrieBase<k, v, A> = Tuple<[Maybe<v>, Map<k, A>]>
  export interface TrieF extends HKT {
    readonly type: TrieBase<this["R"], this["E"], this["A"]>
  }
  export const Covariant = HKT.instance<P.Covariant<TrieF>>({
    map: (f) => ({ tuple: [_, map] }) => trie(_, map.map(f))
  })
  export function empty<k, v, A>(value: Maybe<v>): TrieBase<k, v, A> {
    return trie(value, M.empty<k, A>())
  }
  export function trie<k, v, A>(value: Maybe<v>, map: Map<k, A>): TrieBase<k, v, A> {
    return Tuple(value, map)
  }
  type LookupFn<k, v> = (ks: k[]) => Maybe<v>

  export function lookupFn<k, v>(): Recursive.Fn<TrieF, LookupFn<k, v>, v, k> {
    return (trie) =>
      (keys) =>
        Chunk.from(keys).head.fold(
          () => trie.get(0),
          (key) =>
            trie.get(1).get(key).fold(
              () => none,
              (lookup) => lookup(keys.slice(1))
            )
        )
  }

  export const singleton = <k, v>(value: v): Unfolder.Fn<TrieF, k[], v, k> =>
    (ks) =>
      Chunk.from(ks).head.fold(
        () => empty<k, v, k[]>(Maybe.some(value)),
        (head) =>
          trie<k, v, k[]>(
            none,
            HashMap.from([
              Tuple(head, ks.slice(1))
            ])
          )
      )

  export function fromMap<K, V>(): Unfolder.Fn<TrieF, HashMap<ImmutableArray<K>, V>, V, K> {
    type _T = Tuple<[ImmutableArray<K>, V]>
    type _NET = Tuple<[NonEmptyImmutableArray<K>, V]>
    const isNonEmpty = (u: _T): u is _NET => u.get(0).isNonEmpty()
    const keyToEntry = (_: _NET) => Tuple(
      ImmutableArray.from(_.get(0).toArray.slice(1)),
      _.get(1)
    )

    return (mp) => {
      return trie(
        mp.get(ImmutableArray.empty()),
        HashMap.from(
          Chunk.from(mp.toCollection)
            .filter(isNonEmpty)
            .groupWith(_ => _.get(0).head)
            .map(_ =>
              Tuple(
                _.unsafeHead.get(0).head,
                HashMap.from(_.map(keyToEntry))
              )
            )
        )
      )
    }
  }
  // void testTrieF
  const testFromMap = Recursive.unfold(Covariant, fromMap<string, number>())(HashMap.from([
    Tuple(ImmutableArray.from("a"), 9),
    Tuple(ImmutableArray.from("ab"), 9),
    Tuple(ImmutableArray.from(""), 5)
  ]))
  const find = Recursive.$.fold(Covariant, lookupFn<string, number>())(testFromMap)
  const find2 = Recursive.$.fold(Covariant, lookupFn<string, number>())(
    Recursive.unfold(Covariant, fromMap<string, number>())(HashMap.from([
      Tuple(ImmutableArray.from("these arent the droids youre looking for"), 15),
      Tuple(ImmutableArray.from("these arent yours"), 10),
      Tuple(ImmutableArray.from("these arent ours"), 10)
    ]))
  )
  const findS = (find: (x: string[]) => Maybe<number>) =>
    (lookup: string) =>
      find(lookup.split("")).fold(
        () => `did NOT find "${lookup}"`,
        (value) => `value of "${lookup}" is "${value}"`
      )
  console.log(findS(find)("a"))
  console.log(findS(find)(""))
  console.log(findS(find)("ab"))

  console.log(findS(find2)("these arent"))
  console.log(findS(find2)("these arent yours"))
  console.log(findS(find2)("these arent the droids youre looking for"))
  void testFromMap, find2
  // console.dir(testFromMap)
  // console.log(`finding "${""}" inside ${find([]).value}`)
  // console.log(`"${'a'}" did ${find("a".split("")).isNone() ? "NOT " : ""}find "A"`)
  // console.log(`"${'a'}" did ${find("".split("")).isNone() ? "NOT " : ""}find ""`)
  // console.log(`"${'b'}" did ${find("b".split("")).isNone() ? "NOT " : ""}find "B"`)
  // console.log(`"${'to'}" did ${find2("to".split("")).isNone() ? "NOT " : ""}find "to"`)
  // console.log(`"${'t'}" did ${find2("t".split("")).isNone() ? "NOT " : ""}find "t"`)
  // const find = Recursive.$.fold(Covariant, lookupFn<string, number>())(testFromMap)
  // const find2 = Recursive.$.fold(Covariant, lookupFn<string, number>())(testTrieF)
  // console.log(testFromMap.caseValue)
  // console.log("find(\"hello\") = %s\nfind(\"hell with\") = %s\nfind(\"x\") = %s",
  //   find("hello,".split("")),
  //   find2("to".split("")),
  //   find("too".split(""))
  // )
}

// const chunks = Chunk.from([
//   "ab",
//   "ab",
//   "cb"
// ])
// void chunks
// console.log(
//   // Recursive.$.fold(Trie.Covariant, Trie.count)(
//   // Recursive.unfold(Trie.Covariant, Trie.fromList)(Chunk.from(["ab", "abc"]))
//   // )

//   Trie.fromList(Chunk.from(["ac", "ab"])).toArray,
//   Recursive.$.fold(Trie.Covariant, Trie.count)(
//     Recursive.unfold(Trie.Covariant, Trie.fromList)(Chunk.from(["abcd", "azcd"]))
//   )
//   // Trie.fromList(Chunk.empty()).toArray
// )
// process.exit(0)

export namespace QuickSort {
  const { Covariant, left, right, tree, value } = BinTree
  type BinTreeF = BinTree.BinTreeF
  export function qs2<A>(O: Ord<A>) {
    const merge: Recursive.Fn<BinTreeF, A[], any, A> = (tree) =>
      !tree ?
        [] :
        [...left(tree), value(tree), ...right(tree)]

    const split = ([a, ...as]: Collection<A>) =>
      !a ? null : pipe(
        as,
        ImmutableArray.from,
        ImmutableArray.$.partition((n) => O.lt(a, n)),
        ({ tuple: [left, right] }) => tree(left, a, right)
      )
    return Recursive.refold(Covariant, merge, split)
  }
}

// console.time("rs")
// console.timeEnd("rs")
// console.time("qs")
// console.log(
//   QuickSort.qs2(Ord.number)(ImmutableArray.from([7, 19, 1, 710, 15, 42, 7103, 151, 151]))
// )
// console.timeEnd("qs")
// console.time("qs")
// console.log(
//   QuickSort.qs2(Ord.string.inverted)(
//     ImmutableArray.from("the quick brown fox jumps over the lazy dogs")
//   )
// )
// console.timeEnd("qs")
// console.time("qs")
// console.log(
//   pipe(
//     QuickSort.qs2(Ord.string.contramap(([key, _]: [string, string]) => key))(
//       Object.entries({
//         foo: "bar",
//         bar: "baz"
//       })
//     ),
//     Object.fromEntries
//   )
// )
// console.timeEnd("qs")
