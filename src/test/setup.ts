import { expect, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test case
beforeEach(() => {
  cleanup()
})

// Extend Vitest's expect with custom matchers
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min} to ${max}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${min} to ${max}`,
        pass: false,
      }
    }
  },
  toHaveConflictType(received: any, expectedType: string) {
    const pass = received.type === expectedType
    if (pass) {
      return {
        message: () => `expected conflict not to have type ${expectedType}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected conflict to have type ${expectedType}, got ${received.type}`,
        pass: false,
      }
    }
  }
})

// Declare custom matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(min: number, max: number): T
    toHaveConflictType(type: string): T
  }
}