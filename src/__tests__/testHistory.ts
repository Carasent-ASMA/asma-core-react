import { createMemoryHistory } from 'history'
export const testHistory = createMemoryHistory()
export const subscribeToHistory = (listener: () => void) => {
    const unsubscribe = testHistory.listen(listener)
    return unsubscribe
}
