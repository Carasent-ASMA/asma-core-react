import React from "react"

const DYNAMIC_IMPORT_ERROR_PATTERN =
    /(?:Failed to fetch dynamically imported module|error loading dynamically imported module):\s*(\S+)/i

const getErrorMessage = (error: unknown): string | null => {
    if (typeof error === 'string') {
        return error
    }

    if (error instanceof Error) {
        return error.message
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
        const { message } = error as { message?: unknown }

        return typeof message === 'string' ? message : null
    }

    return null
}

const getDynamicImportUrl = (error: unknown): URL | null => {
    const message = getErrorMessage(error)

    if (!message) {
        return null
    }

    const match = message.match(DYNAMIC_IMPORT_ERROR_PATTERN)
    const url = match?.[1]

    if (!url) {
        return null
    }

    try {
        return new URL(url)
    } catch {
        return null
    }
}

export const lazyWithRetries: typeof React.lazy = (importer) => {
    const retryImport = async () => {
        try {
            return await importer()
        } catch (error) {
            const dynamicImportUrl = getDynamicImportUrl(error)

            if (!dynamicImportUrl) {
                throw error
            }

            // retry 5 times with 2 second delay and backOff factor of 2 (2, 4, 8, 16, 32 seconds)
            for (let i = 0; i < 5; i++) {
                await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i))
                // add a timestamp to the url to force a reload the module (and not use the cached version - cache busting)
                dynamicImportUrl.searchParams.set('t', `${Date.now()}`)

                try {
                    /* @vite-ignore */
                    return await import(dynamicImportUrl.href)
                } catch (retryError) {
                    if (!getDynamicImportUrl(retryError)) {
                        throw retryError
                    }

                    console.log('retrying import')
                }
            }

            throw error
        }
    }

    return React.lazy(retryImport)
}