import { constant } from "@tsplus/stdlib/data/Function"
import type { RList, RListF } from "@tsplus/stdlib/examples/recursive/listr"
import { Functor, Node, substrings, suffixes } from "@tsplus/stdlib/examples/recursive/listr"
import type { Annotated } from "@tsplus/stdlib/prelude/Recursive"
import { Recursive } from "@tsplus/stdlib/prelude/Recursive"

main()
function main() {
  editMain("kitten", "sitting")
  lcsMain("hello", "michaelangelo")
  lcsMain("hello", "hieroglyphology")
  lcsMain("hieroglyphology", "michaelangelo")
  lisMain("carbohydrate")
}

function editMain(s: string, t: string) {
  console.time(`editDistance ${s} => ${t}`)
  const value = editDistance(s, t)
  console.timeEnd(`editDistance ${s} => ${t}`)
  console.log(`editDistance ${s} => ${t} = ${value}`)
}
function lcsMain(s: string, t: string) {
  console.time(`lcs ${s} => ${t}`)
  const value = longestCommonSubsequence(s, t)
  console.timeEnd(`lcs ${s} => ${t}`)
  console.log(`lcs ${s} => ${t} = ${value}`)
}
function lisMain(s: string) {
  const label = `lis("${s}")`
  console.time(label)
  const value = longestIncreasingSequence(s)
  console.timeEnd(label)
  console.log(label + " = " + value)
}
// From https://www.researchgate.net/publication/221440162_Recursion_Schemes_for_Dynamic_Programming
// Typically, edit distance uses a matrix of substrings to store best previous value
// eg the "ate" vs "pit" matrix.  To find the previous values corresponding to insertion,
// deletion and substitution for the cell labeled "*" are marked
//     _ a t e _
//     p . . . .
//     i . * I .
//     t . D S .
//     _ . . . .
// We emulate this using a "walk-of-value" matrix -- one stored as a list.
// For example
// ("ate", "pit"), ("te", pit"), ("e", "pit"), ("", "pit"), ("ate", "it"), ("te", "it") ....
//
// We use an annotated fold over the matrix to store each "cells" edit distance and
// use the string's length to lookup neighboring cells -- the answer pops out at the end
function editDistance(s: string, t: string) {
  return pipe(
    Tuple(s, t),
    Recursive.refoldAnnotated(
      Functor,
      editDistanceAnnotatedAlgebra(s.length),
      substrings(s)
    )
  )
}
function editDistanceAnnotatedAlgebra(len: number): Annotated.Fn<RListF, number> {
  type AnnotatedNode = Node<Annotated<RListF, number>>
  type AnnotatedList = RList<Annotated<RListF, number>>

  return Match.tagFor<AnnotatedList>()({
    "nil": constant(0),
    "node": minDistance
  })
  function minDistance({ head: { tuple: [[a], [b]] }, tail }: AnnotatedNode): number {
    return Math.min(
      lookup(0, tail, 0) + 1, // insert
      lookup(len, tail, 0) + 1, // delete
      lookup(len + 1, tail, 0) + (a == b ? 0 : 1) // substitute
    )
  }
}

// We can also fold the same `substrings` structure to determine the longest common subsequence
function longestCommonSubsequence(s: string, t: string) {
  // this ensures a deterministic result
  const [a, b] = s.length < t.length ? [t, s] : [s, t]
  return pipe(
    Tuple(a, b),
    Recursive.refoldAnnotated(
      Functor,
      longestCommonAlgebra(a.length),
      substrings(a)
    )
  )
}
type AnnotatedNode = Node<Annotated<RListF, string>>
type AnnotatedList = RList<Annotated<RListF, string>>
function longestCommonAlgebra(
  len: number
): Annotated.Fn<RListF, string> {
  const max = Associative.max(Ord.number.contramap((_: string) => _.length))
  const ord = Ord.string
  return Match.tagFor<AnnotatedList>()({
    "nil": constant(""),
    "node": longestSequence
  })
  function longestSequence({ head: { tuple: [[a = ""], [b = ""]] }, tail }: AnnotatedNode): string {
    return !(a && b) ?
      "" :
      ord.compare(a, b) == 0 ?
        // `len + 1` is the cell below and to our right
        (a + lookup(len + 1, tail, "")) :
        // `len` is the cell immediately below
        max.combine(
          lookup(0, tail, ""),
          lookup(len, tail, "")
        )
  }
}
function lookup<A>(n: number, cache: Annotated<RListF, A>, id: A): A {
  return n == 0 ?
    cache.annotations :
    Match.tag(cache.caseValue, {
      "nil": () => id,
      "node": ({ tail }) => lookup(n - 1, tail, id)
    })
}

// And we can use an unfolder that generates `suffixes` of a string, along with an
// `Annotated.Fn` that picks the longest subsequence of the current character
function longestIncreasingSequence(s: string): string {
  return pipe(
    s,
    Recursive.unfold(Functor, suffixes),
    // since each step of our fold will find the longest sequence
    // of just that character, an "empty" wrapper around the whole
    // thing will allow us to pick the best of the bunch
    (b) => Recursive.fix<RListF>(new Node(Tuple("", ""), b)),
    Recursive.$.foldAnnotated(Functor, longestIncreasingAlgebra())
  )
}

function longestIncreasingAlgebra(): Annotated.Fn<RListF, string> {
  const O = Ord.string
  type AnnotatedListString = Annotated<RListF, string>
  return Match.tagFor<AnnotatedList>()({
    "nil": constant(""),
    "node": ({ head, tail }) => head.at(0) + bestChild("", head.at(0), tail)
  })
  function bestChild(accum: string, curr: string, cache: AnnotatedListString): string {
    return Match.tag(cache.caseValue, {
      "nil": () => accum,
      "node": ({ head, tail }) =>
        bestChild(better(head.at(0), cache.annotations, accum), curr, tail)
    })
    // is `curr` smaller than `candidate` and is the cached value bigger than the best we
    // found so far
    function better(candidate: string, annotation: string, accum: string): string {
      return O.lt(curr, candidate) &&
          annotation.length > accum.length ?
        annotation :
        accum
    }
  }
}
