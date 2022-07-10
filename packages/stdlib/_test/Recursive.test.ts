import { constant } from "@tsplus/stdlib/data/Function"
import type * as P from "@tsplus/stdlib/prelude/Covariant"
import { Recursive } from "@tsplus/stdlib/prelude/Recursive"
import type { Annotated } from "@tsplus/stdlib/prelude/Recursive/Annotated"
import { expect, vi } from "vitest"

describe.concurrent("Recursive", () => {
  type Nat<A> = Maybe<A>
  type NatF = Maybe.HKT
  type NatR = Recursive<NatF>
  const Covariant = Maybe.Covariant
  const Foldable = Maybe.Foldable
  const succ = (a: NatR): NatR => Recursive(Maybe(a))
  const zero: NatR = Recursive(Maybe.none as any)
  const one = succ(zero)
  const two = succ(one)
  const three = succ(two)
  const four = succ(three)
  const five = succ(four)
  const countAlgebra = (r: Nat<number>): number =>
    r.fold(
      () => 0,
      (r0) => 1 + r0
    )
  const natcount = Recursive.fold(Maybe.Covariant, countAlgebra)
  const natsum = (left: NatR, right: NatR): NatR =>
    right.fold(Covariant, (f: Nat<NatR>) =>
      f.fold(
        () => left,
        (r) => succ(r)
      ))
  const natproduct = (left: NatR, right: NatR): NatR =>
    right.fold(Covariant, (f: Nat<NatR>) =>
      f.fold(
        () => zero,
        (r) => natsum(r, left)
      ))

  describe("fold", () => {
    it("count", () => {
      assert.equal(natcount(zero), 0)
      assert.equal(natcount(five), 5)
      assert.equal(five.fold(Covariant, countAlgebra), 5)
    })

    it("fib", () => {
      type T = Tuple<[number, number]>
      type NatT = Nat<T>
      const fibAlgebra = (r: NatT): T =>
        r.fold(
          () => Tuple(0, 1),
          ({ tuple: [n1, n2] }) => Tuple(n1 + n2, n1)
        )
      const fib = Recursive.fold(Covariant, fibAlgebra)
      assert.equal(fib(zero).get(0), 0)
      assert.equal(fib(one).get(0), 1)
      assert.equal(fib(five).get(0), 5)
      assert.equal(five.fold(Covariant, fibAlgebra).get(0), 5)
    })

    it("depth first", () => {
      const f = (r: Nat<number[]>) =>
        r.fold(
          () => [-1],
          (accum) => accum.concat([accum.length + 1])
        )
      assert.deepEqual(two.fold(Covariant, f), [-1, 2, 3])
    })

    it("sum", () => {
      assert.equal(natcount(natsum(one, one)), 2)
      assert.equal(natcount(natsum(five, three)), 8)
    })

    it("product", () => {
      assert.equal(natcount(natproduct(one, one)), 1)
      assert.equal(natcount(natproduct(five, three)), 15)
    })

    it("even", () => {
      const evenAlg = (a: Nat<boolean>) =>
        a.fold(
          () => true,
          (p) => !p
        )
      const isEven = Recursive.fold(Covariant, evenAlg)
      assert.isTrue(isEven(zero))
      assert.isFalse(isEven(one))
    })
  })

  describe("foldAnnotated", () => {
    type NatAnnotated<A> = Nat<Annotated<NatF, A>>
    type Cache<A> = Annotated<NatF, A>
    it("count", () => {
      const countAlgebra = (r: NatAnnotated<number>): number =>
        r.fold(
          () => 0,
          (r0) => 1 + r0.annotations
        )
      const natcount = Recursive.foldAnnotated(Covariant, countAlgebra)
      assert.equal(natcount(zero), 0)
      assert.equal(natcount(one), 1)
      assert.equal(natcount(five), 5)
      assert.equal(five.foldAnnotated(Covariant, countAlgebra), 5)
    })

    it("fib", () => {
      const fibAlgebra = (r: NatAnnotated<number>): number =>
        r.fold(
          () => 0,
          (r0) => r0.annotations + lookup(1, r0)
        )

      const fib = Recursive.foldAnnotated(Covariant, fibAlgebra)
      assert.equal(fib(one), 1)
      assert.equal(fib(five), 5)
      assert.equal(five.foldAnnotated(Covariant, fibAlgebra), 5)

      function lookup(n: number, cache: Cache<number>): number {
        return (n == 0) ?
          cache.annotations :
          cache.caseValue.fold(
            () => 1,
            (h) => lookup(n - 1, h)
          )
      }
    })
  })

  describe("unfold", () => {
    const Zero = Maybe.none
    const Succ = Maybe
    it("natural numbers", () => {
      const coalgebra = (a: number): Nat<number> => a == 0 ? Zero : Succ(a - 1)
      const expand = Recursive.unfold(Covariant, coalgebra)

      assert.equal(natcount(expand(0)), 0)
      assert.equal(natcount(expand(5)), 5)
    })
  })

  describe("foldDown", () => {
    it("count", () => {
      const countAlgebra = (accum: number, r: Recursive<NatF>) =>
        r.caseValue.fold(
          () => accum,
          () => accum + 1
        )
      const count = Recursive.foldDown(Maybe.Foldable, 0, countAlgebra)
      assert.equal(count(zero), 0)
      assert.equal(count(one), 1)
      assert.equal(count(five), 5)
      assert.equal(five.foldDown(Maybe.Foldable, 0, countAlgebra), 5)
    })

    it("breadth first", () => {
      const f = (accum: number[], r: Recursive<NatF>) =>
        r.caseValue.fold(
          () => accum.concat([-1]),
          () => accum.concat([accum.length + 1])
        )

      assert.deepEqual(five.foldDown(Foldable, [], f), [1, 2, 3, 4, 5, -1])
    })

    it("fib", () => {
      type FibDownR = Recursive.FoldDownFn<NatF, Tuple<[number, number]>>
      const fibAlgebra: FibDownR = ({ tuple: [n1, n2] }, r) =>
        r.caseValue.fold(
          () => Tuple(n1, n2),
          (_) => Tuple(n1 + n2, n1)
        )
      const fib = Recursive.foldDown(Maybe.Foldable, Tuple(0, 1), fibAlgebra)
      assert.equal(fib(zero).get(0), 0)
      assert.equal(fib(one).get(0), 1)
      assert.equal(fib(five).get(0), 5)
    })
  })

  describe("foldDownSome", () => {
    it("max", () => {
      const maxNumber = (max: number) =>
        (accum: number, r: Nat<NatR>): Maybe<number> =>
          r.fold(
            () => Maybe.some(accum),
            () => accum < max ? Maybe.some(accum + 1) : Maybe.none
          )
      assert.equal(five.foldDownSome(Foldable, 0, maxNumber(3)), 3)
      assert.equal(two.foldDownSome(Foldable, 0, maxNumber(3)), 2)
    })

    it("breadth first", () => {
      const maxCollect = (max: number) =>
        (accum: number[], r: Nat<NatR>) =>
          r.fold(
            () => Maybe.some(accum.concat(-1)),
            () => accum.length < max ? Maybe.some(accum.concat(accum.length)) : Maybe.none
          )
      assert.deepEqual(two.foldDownSome(Foldable, [], maxCollect(5)), [0, 1, -1])
      assert.deepEqual(five.foldDownSome(Foldable, [], maxCollect(4)), [0, 1, 2, 3, -1])
    })
  })

  describe("foldUp", () => {
    it("count", () => {
      const count = (accum: number, r: NatR) =>
        r.caseValue.fold(
          () => accum,
          () => accum + 1
        )

      assert.equal(five.foldUp(Foldable, 0, count), 5)
    })

    it("depth first", () => {
      const toList = (accum: number[], r: NatR) => {
        return r.caseValue.fold(
          () => accum.concat([-1]),
          () => accum.concat([accum.length])
        )
      }
      assert.deepEqual(five.foldUp(Foldable, [], toList), [-1, 1, 2, 3, 4, 5])
    })
  })

  describe("foldM", () => {
    const M = HKT.intersect(
      Eval.Monad,
      Eval.IdentityBoth
    )

    it("count", () => {
      const countEval = Recursive.foldM<NatF, Eval.HKT, number>(Maybe.ForEach, M, (r) =>
        r.fold(
          () => Eval.succeedNow(0),
          (a) => Eval.succeedNow(a + 1)
        ))

      assert.equal(countEval(zero).run, 0)
      assert.equal(countEval(one).run, 1)
      assert.equal(countEval(five).run, 5)
    })

    it("depth first", () => {
      const spy = vi.fn()

      const countEval = Recursive.foldM<NatF, Eval.HKT, number>(Maybe.ForEach, M, (r: Nat<number>) =>
        r.fold(
          () => Eval.succeedNow(0).tap((a) => Eval.succeedNow(spy(a))),
          (a) => Eval.succeedNow(a + 1).tap((a) => Eval.succeedNow(spy(a)))
        ))

      assert.equal(countEval(zero).run, 0)
      expect(spy).toHaveBeenCalledOnce()
      expect(spy).toHaveBeenNthCalledWith(1, 0)
      spy.mockReset()

      assert.equal(countEval(five).run, 5)
      expect(spy).toHaveBeenCalledTimes(6)
      expect(spy).toHaveBeenLastCalledWith(5)
    })
  })
})

describe.concurrent("Recursive#List", () => {
  type IList<R, A> = Cons<R, A> | Nil<A>
  interface ListF extends HKT {
    readonly type: IList<this["R"], this["A"]>
  }
  type List<A> = Recursive<ListF, A>
  const Covariant = HKT.instance<P.Covariant<ListF>>({
    map: (f) => (fa) => fa.map(f)
  })
  class Cons<R, A> {
    readonly _tag = "Cons"
    constructor(readonly head: R, readonly tail: A) {}
    map<B>(f: (a: A) => B) {
      return new Cons(this.head, f(this.tail))
    }
  }
  class Nil<A> {
    readonly _tag = "Nil"
    map<B>(_: (a: A) => B) {
      return this as any
    }
  }
  const nil = <R>() => {
    const _: HKT.Kind<ListF, R, never, List<R>> = new Nil()
    return Recursive<ListF, R>(_)
  }
  const cons = <R, R1 extends R>(head: R1, tail: List<R>) => {
    return Recursive<ListF, R1>(new Cons(head, tail))
  }
  const fromArray = Recursive.unfold<ListF, unknown[]>(
    Covariant,
    ([a, ...as]) => !a ? new Nil() : new Cons(a, as)
  )
  const toArray = Recursive.fold<ListF, unknown[]>(Covariant, (a) =>
    Match.tag(a, {
      "Nil": constant([]),
      "Cons": (_) => [_.head, ..._.tail]
    }))
  const len = Recursive.fold(Covariant, (a: IList<unknown, number>) =>
    Match.tag(a, {
      "Nil": constant(0),
      "Cons": (_) => 1 + _.tail
    }))
  const empty = nil()
  const one = cons(1, empty)
  const oneTwo = cons(2, one)

  describe("length", () => {
    it("of nil is 0", () => expect(len(empty)).to.equal(0))
    it("of one is 1", () => expect(len(one)).to.equal(1))
    it("of two is 2", () => expect(len(oneTwo)).to.equal(2))
  })

  describe("fromArray", () => {
    it("len is equal to array size", () => expect(len(fromArray([1, 2, 3, 4]))).to.equal(4))
    it("works with strings", () => expect(len(fromArray("hello".split("")))).to.equal(5))
  })

  describe("toArray", () => {
    it("converting from then to", () => {
      expect(toArray(fromArray([1, 2, 3, 4]))).to.deep.equal([1, 2, 3, 4])
      expect(toArray(fromArray("hello".split("")))).to.deep.equal("hello".split(""))
    })
  })
})
