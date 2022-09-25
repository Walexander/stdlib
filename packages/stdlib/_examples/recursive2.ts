import { constant } from "@tsplus/stdlib/data/Function"
import { ListF } from "@tsplus/stdlib/examples/recursive/base"
import { Recursive } from "@tsplus/stdlib/prelude/Recursive"

function main() {
  // const fn = rpn("1 2 + 4 * 3 / 4 -")
  // const fn2 = rpn("1 2 4 3 4 9 + * / - + 15 -")
  // console.log(rpn("12 6 4 * /"))
  // console.log(rpn("12 6 4 foo * /"))
  // console.log(rpn("12 * /"))
  // console.log(fn)
  // console.log(fn2)
  console.time("void")
  console.timeEnd("void")
  console.time("rpn")
  console.log(rpn("15 7 1 1 + - / 3 * 2 1 1 + + -"))
  console.timeEnd("rpn")
  console.time("rpn2")
  console.log(rpn2("15 7 1 1 + - / 3 * 2 1 1 + + -"))
  console.timeEnd("rpn2")
  // console.log(rpn2("7 5 3 12 -1 + - * *"))
  // console.log(rpn2("7 5 3 12 + -1 - * *"))
  // console.log(rpn2("7 5 3 + 12 -1 - * *"))
  // console.log(rpn2("7 5 + 3 - 12 -1 * *"))
  // console.log(rpn2("7 5 + 3 - 12 * -1 *"))
}

function rpn2(input: string) {
  const eval_ = Recursive.refold(ListF.Covariant, evalRpn, parseRpn)(input)
  const print_ = Recursive.refold(ListF.Covariant, printRpn, parseRpn)(input)
  return pipe(
    Tuple(
      eval_([]),
      print_([])
    ),
    ({ tuple }) =>
      `${input} =>
${tuple[1]}
${(new Array(tuple[1][0]?.length ?? 0)).fill("-").join("")} = ${tuple[0]}`
  )
}

function rpn(input: string) {
  const parse_ = ListF.unfold(parseRpn)(input)
  const eval_ = ListF.fold(evalRpn)
  const print = ListF.fold(printRpn)
  return pipe(
    parse_,
    (recursive) =>
      Tuple(
        eval_(recursive)([]),
        print(recursive)([])
      ),
    ({ tuple }) => `${input} => ${tuple[1]} = ${tuple[0]}`
  )
}

type Lit = number
type Op = { show: string; fn: (x: number, y: number) => number }
type Token = Lit | Op
type Stack = Array<number>
type StackFn = (s0: Stack) => Stack

const parseRpn = (input: string) => {
  const [head, ...rest] = input.split(" ")
  return !isDefined(head) || input.length == 0 ?
    ListF.nil() :
    ListF.cons(parseToken(head.trim()), rest.join(" ").trim())
}

export const evalRpn: Recursive.Fn<ListF.HKT, StackFn, Token> = (r) =>
  Match.tag(r, {
    "nill": constant(identity),
    "cons": ({ head, tail }) =>
      (accum: Stack) => {
        const [x = 0, y = 0, ...stack] = accum
        const stack1 = typeof head == "number" ?
          [head].concat(accum) :
          // `x` and `y` are reversed
          [head.fn(y, x), ...stack]
        return tail(stack1)
      }
  })

export const printRpn: Recursive.Fn<ListF.HKT, (stack: string[]) => string[], Token> = (r) => {
  return Match.tag(r, {
    "nill": constant(identity),
    "cons": ({ head, tail }) =>
      (accum: string[]) => {
        const [x = 0, y = 0, ...stack] = accum
        const stack1 = typeof head == "number" ?
          [head.toFixed(0)].concat(accum) :
          [`(${y} ${head.show} ${x})`, ...stack]
        return tail(stack1)
      }
  })
}

function parseToken(input: string): Token {
  switch (input) {
    case "+":
      return { show: input, fn: Associative.sum.combine }
    case "*":
      return { show: input, fn: Associative.product.combine }
    case "/":
      return { show: input, fn: (x: number, y: number) => x / y }
    case "-":
      return { show: input, fn: (x: number, y: number) => x - y }
    default:
      return parseInt(input, 10)
  }
}

main()
