import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('asma-core-helpers', async () => {
    const { testHistory, subscribeToHistory } = await import('./testHistory')
    return {
        getParamByName: (name: string): string | string[] | null => {
            const params = new URLSearchParams(testHistory.location.search)
            const value = params.get(name)
            if (typeof value === 'string' && value.includes(',')) {
                return value.split(',')
            }
            return value
        },
        history: testHistory,
        subscribeToHistory,
    }
})

import { testHistory } from './testHistory'
import { useHideParam } from '../hooks/useHideParam'

const navigate = (search: string) => {
    act(() => testHistory.push({ search }))
}

beforeEach(() => {
    act(() => {
        testHistory.push({ search: '' })
    })
})

describe('useHideParam', () => {
    it('returns null when hide param is absent', () => {
        const { result } = renderHook(() => useHideParam())
        expect(result.current).toBeNull()
    })

    it('returns parsed array when hide param is present', () => {
        navigate('?hide=sidebar,header')
        const { result } = renderHook(() => useHideParam())
        expect(result.current).toEqual(['sidebar', 'header'])
    })

    it('returns same array reference when value has not changed', () => {
        navigate('?hide=sidebar,header')
        const { result } = renderHook(() => useHideParam())

        const firstRef = result.current

        navigate('?hide=sidebar,header&activity_id=12641')

        expect(result.current).toBe(firstRef) // same reference, not just equal
    })

    it('returns new array reference when value changes', () => {
        navigate('?hide=sidebar,header')
        const { result } = renderHook(() => useHideParam())

        const firstRef = result.current

        navigate('?hide=sidebar,header,footer')

        expect(result.current).not.toBe(firstRef)
        expect(result.current).toEqual(['sidebar', 'header', 'footer'])
    })

    it('returns to null when hide param is removed', () => {
        navigate('?hide=sidebar,header')
        const { result } = renderHook(() => useHideParam())
        expect(result.current).toEqual(['sidebar', 'header'])

        navigate('')
        expect(result.current).toBeNull()
    })
})
