import { describe, expect, it } from 'vitest'
import {
  formatAmount,
  formatExpression,
  formatRate,
  NOT_AVAILABLE,
} from '@/shared/lib/number-format'

describe('formatAmount', () => {
  it('uses thousands separators and a fixed 3 fraction digits', () => {
    expect(formatAmount(1234.5678)).toBe('1,234.568')
    expect(formatAmount(1000000)).toBe('1,000,000.000')
    expect(formatAmount(0)).toBe('0')
    expect(formatAmount(2.5)).toBe('2.500')
  })

  it('returns the placeholder for missing or non-finite values', () => {
    expect(formatAmount(null)).toBe(NOT_AVAILABLE)
    expect(formatAmount(undefined)).toBe(NOT_AVAILABLE)
    expect(formatAmount(Number.NaN)).toBe(NOT_AVAILABLE)
    expect(formatAmount(Number.POSITIVE_INFINITY)).toBe(NOT_AVAILABLE)
  })

  it('never renders negative zero', () => {
    expect(formatAmount(-0)).toBe('0')
    expect(formatAmount(-0.0001)).toBe('0')
    expect(formatAmount(-0.5)).toBe('-0.500')
  })
})

describe('formatRate', () => {
  it('always shows 3 fraction digits', () => {
    expect(formatRate(0.0773)).toBe('0.077')
    expect(formatRate(2.549)).toBe('2.549')
    expect(formatRate(33)).toBe('33.000')
    expect(formatRate(12958.123)).toBe('12,958.123')
  })
})

describe('formatExpression', () => {
  it('groups digits inside each number literal', () => {
    expect(formatExpression('1000+2500.')).toBe('1,000+2,500.')
    expect(formatExpression('1234567.891')).toBe('1,234,567.891')
    expect(formatExpression('12*3')).toBe('12*3')
  })

  it('shows zero for an empty expression', () => {
    expect(formatExpression('')).toBe('0')
  })
})
