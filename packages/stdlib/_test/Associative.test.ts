describe.concurrent("Associative", () => {
  it("all", () => {
    assert.strictEqual(Associative.all.combine(true, true), true)
    assert.strictEqual(Associative.all.combine(false, true), false)
    assert.strictEqual(Associative.all.combine(true, false), false)
    assert.strictEqual(Associative.all.combine(false, false), false)
  })

  it("any", () => {
    assert.strictEqual(Associative.any.combine(true, true), true)
    assert.strictEqual(Associative.any.combine(false, true), true)
    assert.strictEqual(Associative.any.combine(true, false), true)
    assert.strictEqual(Associative.any.combine(false, false), false)
  })

  it("first", () => {
    assert.strictEqual(Associative.first<number>().combine(1, 2), 1)
  })

  it("function", () => {
    const S = Associative.function(Associative.sum)<string>()
    assert.strictEqual(S.combine((s) => s.length - 1, (s) => s.length + 1)("hello"), 10)
  })

  it("intercalate", () => {
    const S = Associative.string.intercalate(",")
    assert.strictEqual(S.combine("a", "b"), "a,b")
  })

  it("inverted", () => {
    const S = Associative.string.inverted
    assert.strictEqual(S.combine("a", "b"), "ba")
  })

  it("last", () => {
    assert.strictEqual(Associative.last<number>().combine(1, 2), 2)
  })

  it("max", () => {
    const S = Associative.max(Ord.number)
    assert.strictEqual(S.combine(1, 2), 2)
  })

  it("min", () => {
    const S = Associative.min(Ord.number)
    assert.strictEqual(S.combine(1, 2), 1)
  })

  it("object", () => {
    interface T {
      readonly foo?: number
      readonly bar: string
    }
    const foo: T = {
      foo: 123,
      bar: "456"
    }
    const bar: T = {
      bar: "123"
    }
    const S = Associative.object<T>()

    assert.deepStrictEqual(S.combine(foo, bar), Object.assign({}, foo, bar))
  })

  it("product", () => {
    assert.strictEqual(Associative.product.combine(2, 3), 6)
  })

  it("string", () => {
    assert.strictEqual(Associative.string.combine("a", "b"), "ab")
  })

  it("struct", () => {
    assert.deepStrictEqual(
      Associative.struct({ a: Associative.string }).combine({ a: "a" }, { a: "b" }),
      { a: "ab" }
    )
    // Should ignore non own properties
    const S = Associative.struct(Object.create({ a: 1 }))
    assert.deepStrictEqual(S.combine({}, {}), {})
  })

  it("sum", () => {
    assert.strictEqual(Associative.sum.combine(2, 3), 5)
  })

  it("tuple", () => {
    const S1 = Associative.tuple(Associative.string, Associative.sum)
    const S2 = Associative.tuple(Associative.string, Associative.sum, Associative.all)

    assert.deepStrictEqual(S1.combine(["a", 1], ["b", 2]), ["ab", 3])
    assert.deepStrictEqual(S2.combine(["a", 1, true], ["b", 2, false]), ["ab", 3, false])
  })

  it("void", () => {
    assert.isUndefined(Associative.void.combine(undefined, undefined))
  })

  describe("derived", () => {
    it("Maybe", () => {
      const assocSum = Derive<Associative<Maybe<number>>>()
      const assocString = Derive<Associative<Maybe<string>>>()
      assert.deepStrictEqual(
        assocSum.combine(
          Maybe.some(1),
          Maybe.some(3)
        ),
        Maybe.some(4)
      )
      assert.deepStrictEqual(
        assocString.combine(Maybe.some("hello"), Maybe.some("world")),
        Maybe.some("helloworld")
      )
      assert.deepStrictEqual(
        assocSum.combine(
          Maybe.none,
          Maybe.some(3)
        ),
        Maybe.none
      )
    })

    describe("Either", () => {
      it("derives an appropriate instance for string", () => {
        const assoc = Derive<Associative<Either<any, string>>>()
        assert.deepStrictEqual(
          assoc.combine(
            Either.right("Foo"),
            Either.right("Bar")
          ),
          Either.right("FooBar")
        )
      })
      it("derives ImmuatableArray<string>", () => {
        const assoc = Derive<Associative<Either<any, ImmutableArray<string>>>>()
        assert.deepStrictEqual(
          assoc.combine(
            Either.right(ImmutableArray("Foo")),
            Either.right(ImmutableArray("Bar"))
          ),
          Either.right(ImmutableArray("Foo", "Bar"))
        )
      })
    })

    describe("ImmutableArray", () => {
      const assoc = Derive<Associative<ImmutableArray<string>>>()
      it("derives instance for string", () => {
        assert.deepStrictEqual(
          assoc.combine(
            ImmutableArray("Foo"),
            ImmutableArray("Bar")
          ),
          ImmutableArray("Foo", "Bar")
        )
      })

      it("handles empty", () => {
        assert.deepStrictEqual(
          assoc.combine(
            ImmutableArray("Foo"),
            ImmutableArray.empty()
          ),
          ImmutableArray("Foo")
        )
      })
    })

    describe("HashMap", () => {
      it("combines numbers", () => {
        const assoc = Derive<Associative<HashMap<unknown, number>>>()
        const x = HashMap.empty().set("B", 1).set("A", 1)
        const y = HashMap.empty().set("A", 2)
        const expect = HashMap.empty().set("A", 3).set("B", 1)
        assert.deepStrictEqual(assoc.combine(x, y), expect)
      })
      it("combines strings", () => {
        const assoc = Derive<Associative<HashMap<unknown, string>>>()
        const x = HashMap.empty().set("B", "Bx").set("A", "Ax")
        const y = HashMap.empty().set("A", "Ay")
        const expect = HashMap.empty().set("A", "AxAy").set("B", "Bx")
        assert.deepStrictEqual(assoc.combine(x, y), expect)
      })
    })
  })
})
/** @tsplus implicit */
export const sum = Associative.sum.combine

/** @tsplus implicit */
export const concat = Associative.string.combine
