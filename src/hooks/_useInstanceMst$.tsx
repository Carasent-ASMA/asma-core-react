import { useEffect, useState } from 'react'
import { onSnapshot, type IStateTreeNode, type IDisposer, isStateTreeNode, applySnapshot } from 'mobx-state-tree'

type MakeInspectable = (store: IStateTreeNode) => void
type MakeInspectableModule = {
    default?: MakeInspectable | MakeInspectableModule
    mobxDevtoolsMST?: MakeInspectable
}

/**
 * @important
 *      initFn.name must be unique please do not use anonymous functions or .create() from MST but rather wrap it in a new function with a unique name
 *
 * @var do_not_persist ?bool should not be persisted to indexedDB default false
 * @var unique_index required string if you need to have multiple instances of the same store with different data
 * @var initFn should return the MST store
 *
 * @example
 *
 *      function createAnonymousSchemaRoot$() {
 *          #optionally if you need to to have some predefined data in snapshot
 *          const optionalSnapshot = {...}
 *
 *          const store = AnonymousSchemaRoot$.create(optionalSnapshot)
 *          //write your logic for creating the store here
 *
 *          //optional applySnapshot if you want to do an async request and then apply to the snapshot
 *          fetchDataFromSomewhere()
 *              .then((data) => { applySnapshot(store, data)})
 *              .catch((err) => {
 *                  //do something logic here to reset data etc
 *                  console.error(err)
 *              })
 *
 *          return store
 *      }
 *
 *      const AnonymousSchemaIndex: React.FC = () => {
 *          const anonymous_schema$ = useInitMst$(createAnonymousSchemaRoot$)
 *      ...
 *      }
 */
const asma_debug = !!localStorage.getItem('asma-debug')

/**
 * @deprecated will be removed in next major version use _useInstanceMst$ instead
 */
export const useInstanceMst$ = _useInstanceMst$

type IFDBFn = (store: object) => { unregisterAll: () => void; idb_check_promise: Promise<void> }
export function _useInstanceMst$<T extends IStateTreeNode, IFDB extends IFDBFn>(
    initFn: () => T,
    initIDBListenersOnMstSn: IFDB,
    {
        unique_index,
        do_not_persist = false,
        inspectable = false,
        storage = 'indexedDB',
        mobxDevtoolsMst,
        getOpenReplayObject,
        persist_keys,
    }: {
        persist_keys?: (keyof T)[]
        storage?: 'localStorage' | 'indexedDB'
        unique_index: string
        do_not_persist?: boolean
        inspectable: boolean
        mobxDevtoolsMst: () => Promise<MakeInspectableModule>
        getOpenReplayObject: () => {
            mobxObserver:
                | ((ev: { type: string; name: string; object: any; debugObjectName: string }) => void)
                | undefined
        }
    },
) {
    const [store] = useState(initFn)

    useEffect(() => {
        /**
         *
         */

        if (inspectable || asma_debug) {
            setMobxDevTools(store, mobxDevtoolsMst)
        }

        let dispose: IDisposer | undefined

        const mobxObserver = getOpenReplayObject().mobxObserver

        if (mobxObserver) {
            dispose = onSnapshot(store, (snapshot) => {
                mobxObserver({
                    type: 'snapshot',
                    name: initFn.name,
                    object: snapshot,
                    debugObjectName: initFn.name,
                })
            })
        }

        if (do_not_persist) return

        const unregister = initPersist({
            initIDBListenersOnMstSn,
            storage,
            initFn_name: initFn.name,
            unique_index,
            persist_keys,
            store,
        })

        return () => {
            unregister.forEach((fn) => {
                fn()
            })
            dispose?.()
        }
    }, [
        do_not_persist,
        getOpenReplayObject,
        initFn.name,
        initIDBListenersOnMstSn,
        inspectable,
        mobxDevtoolsMst,
        persist_keys,
        storage,
        unique_index,
        store,
    ])
    return store
}

function initPersist<T extends IStateTreeNode>(props: {
    storage: 'localStorage' | 'indexedDB'
    initIDBListenersOnMstSn: IFDBFn
    store: T
    persist_keys?: (keyof T)[]
    unique_index: string
    initFn_name: string
}) {
    const { store, persist_keys, storage, initFn_name, unique_index } = props

    const unregister: (() => void)[] = []

    const onSnapshotCall = (store: IStateTreeNode, key?: string) => {
        const key_name = key ? `${unique_index}-${initFn_name}-${key}` : `${unique_index}-${initFn_name}`

        if (props.storage === 'localStorage') {
            const unReg = onSnapshot(store, () => {
                localStorage.setItem(key_name, JSON.stringify(store))
            })

            unregister.push(unReg)

            const lsItem = localStorage.getItem(key_name)

            if (lsItem) {
                try {
                    const parsed = JSON.parse(lsItem)

                    if (parsed) {
                        applySnapshot(store, parsed)
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        } else if (props.storage === 'indexedDB') {
            const { unregisterAll } = props.initIDBListenersOnMstSn({
                [key_name]: store,
            })

            unregister.push(unregisterAll)
        }
    }
    if (!persist_keys) {
        if (storage === 'localStorage') {
            onSnapshotCall(store)
        } else {
        }
    } else {
        persist_keys.forEach((key) => {
            const subStore = store[key]

            if (isStateTreeNode(subStore) && typeof key === 'string') {
                if (storage === 'localStorage') {
                    onSnapshotCall(subStore, key)
                }
            }
        })
    }
    return unregister
}

async function setMobxDevTools(store: IStateTreeNode, mobx_devTools_mst?: () => Promise<MakeInspectableModule>) {
    const module = await mobx_devTools_mst?.()
    const makeInspectable = resolveMakeInspectable(module)

    if (!makeInspectable) {
        console.warn('mobx-devtools-mst is not installed')

        return
    }
    makeInspectable(store)
}

function resolveMakeInspectable(module?: MakeInspectableModule): MakeInspectable | undefined {
    if (!module) {
        return undefined
    }

    if (typeof module === 'function') {
        return module
    }

    if (typeof module.default === 'function') {
        return module.default
    }

    if (module.default && typeof module.default === 'object') {
        if (typeof module.default.default === 'function') {
            return module.default.default
        }

        if (typeof module.default.mobxDevtoolsMST === 'function') {
            return module.default.mobxDevtoolsMST
        }
    }

    if (typeof module.mobxDevtoolsMST === 'function') {
        return module.mobxDevtoolsMST
    }

    return undefined
}
export default _useInstanceMst$
