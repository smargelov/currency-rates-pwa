/**
 * Calculator expression model for the amount input.
 *
 * The active currency row holds a raw expression string such as `100+25*2`.
 * Operators are stored in ASCII form (`+ - * /`) and rendered with
 * typographic glyphs by the UI. Evaluation is a small recursive-descent
 * parser with the usual precedence (`* /` above `+ -`); no `eval`.
 */

export type Operator = '+' | '-' | '*' | '/'

export const OPERATORS: readonly Operator[] = ['+', '-', '*', '/']

/** Hard limit to keep the input readable and the UI stable. */
export const MAX_EXPRESSION_LENGTH = 32

/** Max digits in a single number literal (integer + fraction parts). */
export const MAX_NUMBER_DIGITS = 15

const OPERATOR_GLYPHS: Record<Operator, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
}

export function isOperator(char: string): char is Operator {
  return (OPERATORS as readonly string[]).includes(char)
}

/** Maps internal operators to display glyphs, leaving numbers untouched. */
export function toDisplayOperators(expression: string): string {
  return expression.replace(/[+\-*/]/g, (op) => OPERATOR_GLYPHS[op as Operator])
}

type Token = { type: 'number'; value: number } | { type: 'operator'; value: Operator }

function tokenize(expression: string): Token[] | null {
  const tokens: Token[] = []
  let i = 0
  while (i < expression.length) {
    const char = expression[i]!
    if (isOperator(char)) {
      tokens.push({ type: 'operator', value: char })
      i += 1
      continue
    }
    if (/[\d.]/.test(char)) {
      let j = i
      while (j < expression.length && /[\d.]/.test(expression[j]!)) j += 1
      const literal = expression.slice(i, j)
      if (!/^\d+(\.\d*)?$|^\.\d+$/.test(literal)) return null
      tokens.push({ type: 'number', value: Number(literal) })
      i = j
      continue
    }
    return null
  }
  return tokens
}

class Parser {
  private pos = 0

  constructor(private readonly tokens: Token[]) {}

  parse(): number | null {
    if (this.tokens.length === 0) return 0
    const value = this.parseSum()
    if (value === null || this.pos !== this.tokens.length) return null
    return value
  }

  private parseSum(): number | null {
    let left = this.parseProduct()
    if (left === null) return null
    while (this.peekOperator('+', '-')) {
      const op = this.next() as Extract<Token, { type: 'operator' }>
      const right = this.parseProduct()
      if (right === null) return null
      left = op.value === '+' ? left + right : left - right
    }
    return left
  }

  private parseProduct(): number | null {
    let left = this.parseNumber()
    if (left === null) return null
    while (this.peekOperator('*', '/')) {
      const op = this.next() as Extract<Token, { type: 'operator' }>
      const right = this.parseNumber()
      if (right === null) return null
      if (op.value === '/') {
        if (right === 0) return null
        left = left / right
      } else {
        left = left * right
      }
    }
    return left
  }

  /** A number literal, optionally preceded by a unary minus (only produced by `=`). */
  private parseNumber(): number | null {
    let sign = 1
    if (this.peekOperator('-')) {
      this.pos += 1
      sign = -1
    }
    const token = this.tokens[this.pos]
    if (!token || token.type !== 'number') return null
    this.pos += 1
    return sign * token.value
  }

  private peekOperator(...ops: Operator[]): boolean {
    const token = this.tokens[this.pos]
    return token?.type === 'operator' && ops.includes(token.value)
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++]
  }
}

/**
 * Evaluates a complete expression. Returns `null` for malformed input,
 * division by zero, or non-finite results.
 */
export function evaluate(expression: string): number | null {
  const tokens = tokenize(expression)
  if (tokens === null) return null
  const result = new Parser(tokens).parse()
  if (result === null || !Number.isFinite(result)) return null
  return result
}

/**
 * Evaluates what the user has typed so far, ignoring an incomplete tail
 * (a trailing operator or a dangling decimal point). Used for live conversion
 * while the expression is being edited. Empty input evaluates to `0`.
 */
export function evaluatePartial(expression: string): number | null {
  let trimmed = expression
  while (trimmed.length > 0) {
    const last = trimmed[trimmed.length - 1]!
    if (isOperator(last) || last === '.') {
      trimmed = trimmed.slice(0, -1)
    } else {
      break
    }
  }
  if (trimmed === '') return 0
  return evaluate(trimmed)
}

/** Returns the trailing number literal of the expression (possibly empty). */
function currentLiteral(expression: string): string {
  const match = /(\d*\.?\d*)$/.exec(expression)
  return match?.[1] ?? ''
}

function countDigits(literal: string): number {
  return literal.replace(/\D/g, '').length
}

/** Appends a digit, collapsing a lone leading zero (`0` + `5` → `5`). */
export function appendDigit(expression: string, digit: string): string {
  if (!/^\d$/.test(digit)) return expression
  const literal = currentLiteral(expression)
  if (literal === '0') {
    return expression.slice(0, -1) + digit
  }
  if (countDigits(literal) >= MAX_NUMBER_DIGITS) return expression
  if (expression.length >= MAX_EXPRESSION_LENGTH) return expression
  return expression + digit
}

/** Appends a decimal point; at most one per number, `.` after operator becomes `0.`. */
export function appendDot(expression: string): string {
  const literal = currentLiteral(expression)
  if (literal.includes('.')) return expression
  if (expression.length >= MAX_EXPRESSION_LENGTH - 1) return expression
  if (literal === '') return expression + '0.'
  return expression + '.'
}

/**
 * Appends a binary operator. A trailing operator is replaced; a trailing
 * dangling point is dropped; operators are ignored on empty input.
 */
export function appendOperator(expression: string, operator: Operator): string {
  if (expression === '') return expression
  const last = expression[expression.length - 1]!
  if (isOperator(last)) {
    // A lone leading minus (left over from a negative `=` result) cannot be replaced.
    if (expression.length === 1) return ''
    return expression.slice(0, -1) + operator
  }
  const base = last === '.' ? expression.slice(0, -1) : expression
  if (base.length >= MAX_EXPRESSION_LENGTH) return base
  return base + operator
}

/** Deletes the last character. */
export function backspace(expression: string): string {
  return expression.slice(0, -1)
}

/** Collapses the expression to its numeric result (the `=` key). */
export function collapse(expression: string): string {
  const value = evaluatePartial(expression)
  if (value === null) return ''
  return numberToExpression(value)
}

/**
 * Renders a number as an expression literal with a bounded number of
 * fraction digits and no exponent notation.
 */
export function numberToExpression(value: number): string {
  if (!Number.isFinite(value)) return ''
  const fixed = Math.abs(value)
    .toFixed(6)
    .replace(/\.?0+$/, '')
  if (fixed === '0' || fixed === '') return '0'
  return value < 0 ? `-${fixed}` : fixed
}
