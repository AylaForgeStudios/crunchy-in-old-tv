// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.
// Avoid displaying request URLs, token-bearing response bodies or raw stacks.
export const requestErrorMessage = (error, fallback) => {
    const status = Number(error?.httpStatus)
    if (status >= 400 && status <= 599 && status % 1 === 0) {
        return `${fallback} (HTTP ${status})`
    }
    const message = error?.error || error?.message
    return /^Request failed \([A-Z][A-Z0-9_]{1,63}\)$/.test(message || '')
        ? message
        : fallback
}
