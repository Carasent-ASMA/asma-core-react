import { act, cleanup, renderHook } from '@testing-library/react'
import { history } from 'asma-core-helpers'
import type { IUserContext } from 'asma-types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { _useUserContext, useHideParam, useParam } from '../index.js'

afterEach(cleanup)
beforeEach(() => history.replace('/'))

describe('published core-helpers integration', () => {
    it('updates useParam through the real history subscription', () => {
        const { result } = renderHook(() => useParam('activity_id'))
        expect(result.current).toBeNull()

        act(() => history.push('/?activity_id=123'))
        expect(result.current).toBe('123')

        act(() => history.push('/'))
        expect(result.current).toBeNull()
    })

    it('preserves the hide snapshot when only another parameter changes', () => {
        history.replace('/?hide=sidebar,header')
        const { result } = renderHook(() => useHideParam())
        const snapshot = result.current
        expect(snapshot).toEqual(['sidebar', 'header'])

        act(() => history.push('/?hide=sidebar,header&activity_id=123'))
        expect(result.current).toBe(snapshot)

        act(() => history.push('/?hide=sidebar'))
        expect(result.current).toEqual(['sidebar'])
    })

    it('uses the shared shell history for user-context changes', () => {
        const store = {
            user_context: 'ME' as IUserContext,
            onChangeUserContext: vi.fn((value: IUserContext) => {
                store.user_context = value
            }),
        }
        renderHook(() => _useUserContext({ store }))

        act(() => history.push('/?user_context=RECIPIENT'))

        expect(store.user_context).toBe('RECIPIENT')
        expect(store.onChangeUserContext).toHaveBeenCalledExactlyOnceWith('RECIPIENT')
    })
})
