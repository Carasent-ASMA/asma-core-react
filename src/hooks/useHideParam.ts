import { history, subscribeToHistory } from 'asma-core-helpers'
import { useSyncExternalStore } from 'react'

let cachedHide: string[] | null = null
let cachedHideRaw: string | null = null

const getHideSnapshot = (): string[] | null => {
    const raw = new URLSearchParams(history.location.search).get('hide')
    if (raw === cachedHideRaw) return cachedHide // same string > same reference
    cachedHideRaw = raw
    cachedHide = raw ? raw.split(',') : null
    return cachedHide
}

export const useHideParam = (): string[] | null => {
    return useSyncExternalStore(subscribeToHistory, getHideSnapshot)
}
