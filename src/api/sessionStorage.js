// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.
// The API library serializes its entire storage object. Keep only preferences,
// the device identity and the refresh token needed for reopening the app.
const STORAGE_KEY = 'crunchyData'

const retainSessionData = ({ app_config, device, installed, next_donation, token }) => ({
    app_config,
    device,
    installed,
    next_donation,
    token: token && typeof token.refresh_token === 'string' && token.refresh_token
        ? { refresh_token: token.refresh_token }
        : null,
})

export const saveSessionData = (data) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(retainSessionData(JSON.parse(data))))
}

export const loadSessionData = () => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
        return null
    }
    let data
    try {
        // Upstream stored Base64 JSON under the same key.
        data = retainSessionData(JSON.parse(stored[0] === '{' ? stored : window.atob(stored)))
    } catch (_error) {
        window.localStorage.removeItem(STORAGE_KEY)
        return null
    }
    const sanitized = JSON.stringify(data)
    if (stored !== sanitized) {
        window.localStorage.setItem(STORAGE_KEY, sanitized)
    }
    return sanitized
}
