import { act, cleanup, renderHook } from '@testing-library/react'
import type { IUserContext } from 'asma-types'
import { createMemoryHistory } from 'history'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { _useUserContext } from '../hooks/_useUserContext.js'

afterEach(cleanup)

function createStore(userContext: IUserContext = 'ME') {
    const store = {
        user_context: userContext,
        onChangeUserContext: vi.fn((value: IUserContext) => {
            store.user_context = value
        }),
    }

    return store
}

describe('_useUserContext', () => {
    it.each(['ME', 'RECIPIENT'] as const)('updates the store when navigation selects %s', (userContext) => {
        const history = createMemoryHistory()
        const store = createStore(userContext === 'ME' ? 'RECIPIENT' : 'ME')
        renderHook(() => _useUserContext({ store, history }))

        act(() => history.push(`?user_context=${userContext}`))

        expect(store.user_context).toBe(userContext)
        expect(store.onChangeUserContext).toHaveBeenCalledExactlyOnceWith(userContext)
    })

    it('does not notify the store when the context is unchanged', () => {
        const history = createMemoryHistory()
        const store = createStore()
        renderHook(() => _useUserContext({ store, history }))

        act(() => history.push('?user_context=ME'))

        expect(store.onChangeUserContext).not.toHaveBeenCalled()
    })

    it.each(['', '?user_context=', '?user_context=0', '?user_context=__proto__', '?user_context=other'])(
        'ignores absent or invalid context in %s',
        (search) => {
            const history = createMemoryHistory()
            const store = createStore('RECIPIENT')
            renderHook(() => _useUserContext({ store, history }))

            act(() => history.push(search))

            expect(store.user_context).toBe('RECIPIENT')
            expect(store.onChangeUserContext).not.toHaveBeenCalled()
        },
    )

    it('applies the initial context when an immediate callback is requested', () => {
        const history = createMemoryHistory({ initialEntries: ['/?user_context=RECIPIENT'] })
        const store = createStore()

        renderHook(() => _useUserContext({ store, history, immediate_callback: true }))

        expect(store.user_context).toBe('RECIPIENT')
    })

    it('waits for navigation by default', () => {
        const history = createMemoryHistory({ initialEntries: ['/?user_context=RECIPIENT'] })
        const store = createStore()

        renderHook(() => _useUserContext({ store, history }))

        expect(store.user_context).toBe('ME')
        expect(store.onChangeUserContext).not.toHaveBeenCalled()
    })

    it('calls the side effect for navigation even without a valid context change', () => {
        const history = createMemoryHistory()
        const store = createStore()
        const sideEffect = vi.fn()
        renderHook(() => _useUserContext({ store, history, sideEffect }))

        act(() => history.push('?activity_id=123'))

        expect(sideEffect).toHaveBeenCalledExactlyOnceWith({ action: history.action, location: history.location })
        expect(store.onChangeUserContext).not.toHaveBeenCalled()
    })

    it('stops observing navigation after unmount', () => {
        const history = createMemoryHistory()
        const store = createStore()
        const sideEffect = vi.fn()
        const { unmount } = renderHook(() => _useUserContext({ store, history, sideEffect }))

        unmount()
        act(() => history.push('?user_context=RECIPIENT'))

        expect(store.onChangeUserContext).not.toHaveBeenCalled()
        expect(sideEffect).not.toHaveBeenCalled()
    })
})
