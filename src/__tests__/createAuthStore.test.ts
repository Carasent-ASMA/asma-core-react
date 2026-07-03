import { expect, test } from 'vitest'

import { createAuthStore } from '../helpers/createAuthStore.js'

test('valid jwt authenticates', () => {
    const { auth$, checkIfUserIsAuthenticated } = createAuthStore({ isJwtValid: () => true })
    expect(checkIfUserIsAuthenticated()).toBe(true)
    expect(auth$.is_authenticated).toBe(true)
})

test('invalid jwt logs out unless explicitly authenticated', () => {
    const store = createAuthStore({ isJwtValid: () => false })
    expect(store.checkIfUserIsAuthenticated()).toBe(false)
    expect(store.checkIfUserIsAuthenticated(true)).toBe(true)
})

test('logout resets authentication', () => {
    const { auth$, checkIfUserIsAuthenticated, logout } = createAuthStore({ isJwtValid: () => true })
    checkIfUserIsAuthenticated()
    logout()
    expect(auth$.is_authenticated).toBe(false)
})
