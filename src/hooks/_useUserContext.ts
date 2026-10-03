import type { IUserContext } from 'asma-types'
import type { History, Update } from 'history'

import { _useHistoryListen } from './_useHistoryListen.js'

type UserContextStore = {
    user_context: IUserContext
    onChangeUserContext: (user_context: IUserContext) => void
}

type UseUserContextOptions = {
    store: UserContextStore
    sideEffect?: (update: Update) => void
    history?: History
    immediate_callback?: boolean
}

/**
 * Synchronizes the store's user context with valid ME/RECIPIENT URL values.
 * @see asma-modules/_docs/frontend/plans/2026-07-05-02-25-plan-migrate-helpers-react-to-core-react.md:118 — PRE-1
 */
export function _useUserContext({ store, sideEffect, history, immediate_callback }: UseUserContextOptions): void {
    _useHistoryListen({
        callback: (update) => {
            const userContext = new URLSearchParams(update.location.search).get('user_context')

            if ((userContext === 'ME' || userContext === 'RECIPIENT') && store.user_context !== userContext) {
                store.onChangeUserContext(userContext)
            }

            sideEffect?.(update)
        },
        history,
        immediate_callback,
    })
}
