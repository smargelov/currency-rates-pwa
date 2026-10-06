import { describe, expect, it } from 'vitest'
import { detectPlatform } from '@/features/install-app/model/use-install'

const UA = {
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  ipadOs:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
}

describe('detectPlatform', () => {
  it('recognizes Android', () => {
    expect(detectPlatform(UA.androidChrome)).toBe('android')
  })

  it('recognizes iPhone and iPadOS (desktop-class UA with touch)', () => {
    expect(detectPlatform(UA.iphoneSafari)).toBe('ios')
    expect(detectPlatform(UA.ipadOs, 5)).toBe('ios')
  })

  it('falls back to desktop', () => {
    expect(detectPlatform(UA.macChrome, 0)).toBe('desktop')
    expect(detectPlatform('')).toBe('desktop')
  })
})
