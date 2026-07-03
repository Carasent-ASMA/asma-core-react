import { type MouseEvent, useCallback, useState } from 'react'

/** Anchor-element toggle state for MUI-style menus/popovers. */
export const useToggleMenuVisibility = () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    const handleOpen = useCallback((event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }, [])

    const handleClose = useCallback(() => {
        setAnchorEl(null)
    }, [])

    return { anchorEl, handleClose, handleOpen, open }
}
