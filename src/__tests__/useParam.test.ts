import { act, renderHook } from '@testing-library/react'
import type { ISearchParams } from 'asma-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('asma-core-helpers', async () => {
    const { testHistory, subscribeToHistory } = await import('./testHistory.js')
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

import { useParam } from '../hooks/useParam.js'
import { testHistory } from './testHistory.js'

const navigate = (search: string): void => {
    act(() => {
        testHistory.push({ search })
    })
}

beforeEach(() => {
    act(() => {
        testHistory.push({ search: '' })
    })
})

describe('useParam', () => {
    describe('initial value', () => {
        it('returns the param value present on mount', () => {
            act(() => {
                testHistory.push({ search: '?activity_id=12641' })
            })
            const { result } = renderHook(() => useParam('activity_id'))
            expect(result.current).toBe('12641')
        })

        it('returns null when param is absent on mount', () => {
            const { result } = renderHook(() => useParam('activity_id'))
            expect(result.current).toBeNull()
        })

        it.fails('useParam("hide") is unstable and loops because it returns a new array snapshot', () => {
            act(() => {
                testHistory.push({ search: '?hide=user-find-replace,sidebar_menu,shortcuts' })
            })

            const { result } = renderHook(() => useParam('hide'))

            expect(result.current).toEqual(['user-find-replace', 'sidebar_menu', 'shortcuts'])
        })
    })

    describe('reactivity', () => {
        it('updates when the param changes via navigation', () => {
            const { result } = renderHook(() => useParam('activity_id'))
            expect(result.current).toBeNull()

            navigate('?activity_id=12641')
            expect(result.current).toBe('12641')
        })

        it('updates to null when param is removed from URL', () => {
            navigate('?activity_id=12641')
            const { result } = renderHook(() => useParam('activity_id'))
            expect(result.current).toBe('12641')

            navigate('')
            expect(result.current).toBeNull()
        })

        it('updates when param value changes', () => {
            navigate('?activity_id=12641')
            const { result } = renderHook(() => useParam('activity_id'))
            expect(result.current).toBe('12641')

            navigate('?activity_id=13048')
            expect(result.current).toBe('13048')
        })
    })

    describe('render efficiency', () => {
        it('does not re-render when an unrelated param changes', () => {
            navigate('?activity_id=12641&selected_patient_id=e8b402ce-a290-4ea6-af79-8594207b4ea1')

            let renderCount = 0
            const { result } = renderHook(() => {
                renderCount++
                return useParam('activity_id')
            })

            const countAfterMount = renderCount
            navigate('?activity_id=12641&selected_patient_id=xyz')

            expect(result.current).toBe('12641')
            expect(renderCount).toBe(countAfterMount)
        })

        it('does not re-render when navigating to same value', () => {
            navigate('?activity_id=12641')

            let renderCount = 0
            const { result } = renderHook(() => {
                renderCount++
                return useParam('activity_id')
            })

            const countAfterMount = renderCount

            navigate('?activity_id=12641')

            expect(result.current).toBe('12641')
            expect(renderCount).toBe(countAfterMount)
        })

        it('re-renders once when navigating to different value', () => {
            navigate('?activity_id=12641')

            let renderCount = 0
            const { result } = renderHook(() => {
                renderCount++
                return useParam('activity_id')
            })

            const countAfterMount = renderCount

            navigate('?activity_id=13048')

            expect(result.current).toBe('13048')
            expect(renderCount).toBe(countAfterMount + 1)
        })
    })

    describe('multiple params', () => {
        it('two instances track their respective params independently', () => {
            navigate('?activity_id=12641&selected_patient_id=e8b402ce-a290-4ea6-af79-8594207b4ea1')

            const { result: activityResult } = renderHook(() => useParam('activity_id'))
            const { result: patientResult } = renderHook(() => useParam('selected_patient_id'))

            expect(activityResult.current).toBe('12641')
            expect(patientResult.current).toBe('e8b402ce-a290-4ea6-af79-8594207b4ea1')

            navigate('?activity_id=13048&selected_patient_id=e8b402ce-a290-4ea6-af79-8594207b4ea1')
            expect(activityResult.current).toBe('13048')
            expect(patientResult.current).toBe('e8b402ce-a290-4ea6-af79-8594207b4ea1')
        })
    })

    describe('param name change', () => {
        it('tracks the new param when paramName changes', () => {
            navigate('?activity_id=12641&selected_patient_id=e8b402ce')

            const { result, rerender } = renderHook(({ name }) => useParam(name), {
                initialProps: { name: 'activity_id' as ISearchParams },
            })

            expect(result.current).toBe('12641')

            rerender({ name: 'selected_patient_id' })
            expect(result.current).toBe('e8b402ce')
        })
    })
})
