import { getParamByName, subscribeToHistory } from 'asma-core-helpers'
import type { ISearchParams, SearchParamWithValues } from 'asma-types'
import { useCallback, useSyncExternalStore } from 'react'

export type ParamValue<K extends ISearchParams> = (typeof SearchParamWithValues)[K] | null

/**
 * Returns the current value of a URL search parameter, reactive to navigation.
 *
 * Built on `useSyncExternalStore` — `getSnapshot` must return a stable primitive.
 * This is guaranteed for all params **except `hide`**, which is a `string[]` and
 * would return a new array reference on every call, causing an infinite re-render loop.
 *
 * @example
 * const activityId = useParam('activity_id')
 *
 * Do NOT use this hook for the `hide` param:
 * const hide = useParam('hide') // new array reference every snapshot call → re-render loop
 *
 * Use the specialized hook instead:
 * const hide = useHideParam()
 */
export const useParam = <K extends ISearchParams>(paramName: K): ParamValue<K> => {
    const getSnapshot = useCallback(() => getParamByName(paramName), [paramName])
    return useSyncExternalStore(subscribeToHistory, getSnapshot)
}
