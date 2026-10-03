import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { createInjectableContext } from '../helpers/CreateInjectableContext.js'

afterEach(cleanup)

describe('createInjectableContext', () => {
    const { StoreProvider, useStore } = createInjectableContext<{ name: string }>()

    function Consumer() {
        return <span>{useStore().name}</span>
    }

    it('renders and updates the provided store', () => {
        const { rerender } = render(
            <StoreProvider store={{ name: 'first' }}>
                <Consumer />
            </StoreProvider>,
        )
        expect(screen.getByText('first')).toBeDefined()

        rerender(
            <StoreProvider store={{ name: 'second' }}>
                <Consumer />
            </StoreProvider>,
        )
        expect(screen.getByText('second')).toBeDefined()
    })

    it('keeps nested providers independent', () => {
        render(
            <StoreProvider store={{ name: 'outer' }}>
                <Consumer />
                <StoreProvider store={{ name: 'inner' }}>
                    <Consumer />
                </StoreProvider>
            </StoreProvider>,
        )

        expect(screen.getByText('outer')).toBeDefined()
        expect(screen.getByText('inner')).toBeDefined()
    })
})
