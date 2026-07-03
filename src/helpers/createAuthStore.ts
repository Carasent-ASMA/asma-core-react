import { type IStateTreeNode, types } from 'mobx-state-tree'

// Not exported: exporting the raw model trips TS2527 on declaration emit (MST's inferred
// model types reference internal unique symbols). Apps consume IAuth$/createAuthStore.
const Auth$ = types
    .model('Auth$', {
        /**
         *  do not use this field directly — use checkIfUserIsAuthenticated() from createAuthStore instead
         */
        is_authenticated: false,
    })
    .actions((self) => ({
        updateField<Keys extends keyof typeof self>(field: Keys, value: (typeof self)[Keys]) {
            self[field] = value
        },
    }))
    .actions((self) => ({
        logoutUser() {
            if (self.is_authenticated) {
                self.is_authenticated = false
            }
        },
    }))

/** The auth store instance shape (replaces per-app `Instance<typeof Auth$>` aliases). */
export interface IAuth$ extends IStateTreeNode {
    readonly is_authenticated: boolean
    updateField(field: 'is_authenticated', value: boolean): void
    logoutUser(): void
}

export type AuthStoreOptions = {
    /** The app's srv-auth binding — truthy while the cached JWT is still valid. */
    isJwtValid: () => unknown
}

export type IAuthStore = {
    auth$: IAuth$
    checkIfUserIsAuthenticated: (authenticated?: boolean) => boolean
    logout: () => void
}

/**
 * Creates the per-app auth store instance. The app's thin binding passes its own
 * `isJwtValid` (from its generateSrvAuthBindings wiring) and re-exports the returned
 * `logout` / `checkIfUserIsAuthenticated` under the app's established names.
 */
export function createAuthStore({ isJwtValid }: AuthStoreOptions): IAuthStore {
    const auth$: IAuth$ = Auth$.create()

    function logout() {
        auth$.logoutUser()
    }

    function checkIfUserIsAuthenticated(authenticated?: boolean) {
        if (auth$.is_authenticated) {
            return auth$.is_authenticated
        }

        if (isJwtValid() || authenticated) {
            auth$.updateField('is_authenticated', true)
        } else {
            logout()
        }

        return auth$.is_authenticated
    }

    return { auth$, checkIfUserIsAuthenticated, logout }
}
