import type { Recursive } from "@tsplus/stdlib/prelude/Recursive"

/**
 * @tsplus type Recursive/Annotated
 * @tsplus companion Recursive/Annotated/Ops
 */
export class Annotated<F extends HKT, A, E = unknown, R = unknown> implements Recursive<F, E, R> {
  constructor(
    readonly caseValue: HKT.Kind<F, R, E, Annotated<F, A, E, R>>,
    readonly annotations: A
  ) {}
}

export declare namespace Annotated {
  /**
   * A function operating on a single level of a recursive structure,
   * with its recursive terms replaced by a value *and* an annotation, which
   * represents the value computed for each child.  aka `Course-of-Value (CV)Algebra`
   */
  export type Fn<F extends HKT, Z, E = unknown, R = unknown> = (
    r: HKT.Kind<F, R, E, Annotated<F, Z, E, R>>
  ) => Z
}

/**
 * @tsplus fluent Recursive/Annotated unfix
 * @tsplus static Recursive/Annotated/Ops unfix
 */
export function unfixAnnotated<F extends HKT, A>({
  caseValue
}: Annotated<F, A>): HKT.Kind<F, unknown, unknown, Annotated<F, A>> {
  return caseValue
}

/**
 * @tsplus static Recursive/Annotated/Ops __call
 * @tsplus static Recursive/Annotated/Ops make
 */
export function makeAnnotated<F extends HKT, Z, E = unknown>(
  caseValue: HKT.Kind<F, unknown, E, Annotated<F, Z>>,
  annotations: Z
): Annotated<F, Z> {
  return new Annotated(caseValue, annotations)
}
