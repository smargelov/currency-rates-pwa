import { describe, expect, it } from 'vitest'
import {
  appendDigit,
  appendDot,
  appendOperator,
  backspace,
  collapse,
  evaluate,
  evaluatePartial,
  MAX_EXPRESSION_LENGTH,
  MAX_NUMBER_DIGITS,
  numberToExpression,
  toDisplayOperators,
} from '@/shared/lib/expression'

describe('evaluate', () => {
  it('evaluates plain numbers', () => {
    expect(evaluate('100')).toBe(100)
    expect(evaluate('0.5')).toBe(0.5)
    expect(evaluate('')).toBe(0)
  })

  it('respects operator precedence', () => {
    expect(evaluate('100+25*2')).toBe(150)
    expect(evaluate('100-20/4')).toBe(95)
    expect(evaluate('2*3+4*5')).toBe(26)
  })

  it('is left-associative within the same precedence', () => {
    expect(evaluate('100-20-30')).toBe(50)
    expect(evaluate('100/5/2')).toBe(10)
  })

  it('returns null on division by zero', () => {
    expect(evaluate('5/0')).toBeNull()
    expect(evaluate('5/0*3')).toBeNull()
  })

  it('returns null on malformed input', () => {
    expect(evaluate('5+')).toBeNull()
    expect(evaluate('+5')).toBeNull()
    expect(evaluate('5++5')).toBeNull()
    expect(evaluate('1.2.3')).toBeNull()
    expect(evaluate('abc')).toBeNull()
  })

  it('accepts a leading unary minus produced by collapse', () => {
    expect(evaluate('-5')).toBe(-5)
    expect(evaluate('-5+10')).toBe(5)
  })
})

describe('evaluatePartial', () => {
  it('ignores a trailing operator', () => {
    expect(evaluatePartial('100+')).toBe(100)
    expect(evaluatePartial('100+25*')).toBe(125)
  })

  it('ignores a dangling decimal point', () => {
    expect(evaluatePartial('100.')).toBe(100)
    expect(evaluatePartial('100+2.')).toBe(102)
  })

  it('treats empty and operator-only input as zero', () => {
    expect(evaluatePartial('')).toBe(0)
    expect(evaluatePartial('-')).toBe(0)
  })

  it('propagates division by zero as null', () => {
    expect(evaluatePartial('5/0+')).toBeNull()
  })
})

describe('input editing', () => {
  it('appends digits and collapses a lone leading zero', () => {
    expect(appendDigit('', '0')).toBe('0')
    expect(appendDigit('0', '5')).toBe('5')
    expect(appendDigit('10', '0')).toBe('100')
    expect(appendDigit('5+0', '7')).toBe('5+7')
    expect(appendDigit('0.', '0')).toBe('0.0')
  })

  it('ignores non-digit input', () => {
    expect(appendDigit('5', 'x')).toBe('5')
  })

  it('allows a single decimal point per number', () => {
    expect(appendDot('')).toBe('0.')
    expect(appendDot('5')).toBe('5.')
    expect(appendDot('5.')).toBe('5.')
    expect(appendDot('5.2')).toBe('5.2')
    expect(appendDot('5.2+')).toBe('5.2+0.')
    expect(appendDot('5.2+3')).toBe('5.2+3.')
  })

  it('replaces a trailing operator and drops a dangling point', () => {
    expect(appendOperator('5', '+')).toBe('5+')
    expect(appendOperator('5+', '*')).toBe('5*')
    expect(appendOperator('5.', '/')).toBe('5/')
  })

  it('ignores operators on empty input and clears a lone minus', () => {
    expect(appendOperator('', '+')).toBe('')
    expect(appendOperator('-', '+')).toBe('')
  })

  it('deletes the last character on backspace', () => {
    expect(backspace('5+2')).toBe('5+')
    expect(backspace('')).toBe('')
  })

  it('enforces length limits', () => {
    const long = '1'.repeat(MAX_NUMBER_DIGITS)
    expect(appendDigit(long, '1')).toBe(long)

    const maxed = '1+'.repeat(MAX_EXPRESSION_LENGTH / 2).slice(0, MAX_EXPRESSION_LENGTH)
    expect(appendDigit(maxed, '1')).toBe(maxed)
  })
})

describe('collapse / numberToExpression', () => {
  it('collapses to the evaluated result', () => {
    expect(collapse('100+25*2')).toBe('150')
    expect(collapse('10/4')).toBe('2.5')
    expect(collapse('5-10')).toBe('-5')
    expect(collapse('')).toBe('0')
  })

  it('collapses invalid expressions to empty input', () => {
    expect(collapse('5/0')).toBe('')
  })

  it('renders numbers without exponent and trailing zeros', () => {
    expect(numberToExpression(1234.5)).toBe('1234.5')
    expect(numberToExpression(0.1 + 0.2)).toBe('0.3')
    expect(numberToExpression(1e-9)).toBe('0')
    expect(numberToExpression(-0)).toBe('0')
  })

  it('honours a custom number of fraction digits', () => {
    expect(numberToExpression(15526.534259, 2)).toBe('15526.53')
    expect(numberToExpression(2.999, 2)).toBe('3')
    expect(collapse('10/3', 2)).toBe('3.33')
  })
})

describe('toDisplayOperators', () => {
  it('maps ASCII operators to glyphs', () => {
    expect(toDisplayOperators('1+2-3*4/5')).toBe('1+2−3×4÷5')
  })
})
