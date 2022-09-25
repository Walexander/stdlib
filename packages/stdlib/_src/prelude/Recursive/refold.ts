import { Annotated } from "@tsplus/stdlib/prelude/Recursive/Annotated"
import type { Recursive } from "@tsplus/stdlib/prelude/Recursive/definition"
import type { Unfolder } from "@tsplus/stdlib/prelude/Recursive/Unfolder"

/**
 * Use a `Covariant<F>`, a `Recursive.Fn<F, B>` and a `Unfolder.Fn<F, A>` to build and then fold
 * a `Recurisve<F>` strucuture.  This is equivalent to the composition of `unfold()` followed
 * by `fold()` but is more efficient.
 * i.e. _hylomorphism_
 *
 * @tsplus static Recursive/Ops refold
 */
export function refold<F extends HKT, A, B, E = unknown, R = unknown>(
  F: Covariant<F>,
  foldFn: Recursive.Fn<F, B, E, R>,
  unfoldFn: Unfolder.Fn<F, A, E, R>
): (z: A) => B {
  return (z: A): B =>
    pipe(
      unfoldFn(z),
      F.map(refold(F, foldFn, unfoldFn)),
      foldFn
    )
}
/**
 * @tsplus static Recursive/Ops refoldAnnotated
 */
export function refoldAnnotated<F extends HKT, A, B>(
  F: Covariant<F>,
  foldFn: Annotated.Fn<F, B>,
  unfoldFn: Unfolder.Fn<F, A>
): (z: A) => B {
  const annotate: Recursive.Fn<F, Annotated<F, B>> = (r) => Annotated(r, foldFn(r))
  const dyna = refold<F, A, Annotated<F, B>>(F, annotate, unfoldFn)
  return (z: A): B => dyna(z).annotations
}
