// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.
const REQUEST_DEADLINE_MS = 20000
const DEFAULT_INTERVAL_MS = 5000
const SLOW_DOWN_INCREMENT_MS = 5000
const MAX_TIMER_MS = 2147483647

const retryAfterMs = (header, now) => {
    if (typeof header !== 'string' || !header.trim()) {
        return null
    }
    const value = header.trim()
    const delay = /^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value) - now
    return Number.isFinite(delay) ? Math.max(0, delay) : null
}

export const runDeviceRequest = (control, request) => {
    let timer
    const cancelled = new Promise((_resolve, reject) => {
        control.cancel = () => {
            control.cancelled = true
            try {
                control.cancelTransport?.()
            } catch (_error) {
                // The local request still expires even if cancellation cannot reach Luna.
            } finally {
                reject(Object.assign(new Error('Activation request cancelled'), { retry: true }))
            }
        }
        timer = setTimeout(control.cancel, REQUEST_DEADLINE_MS)
    })
    const response = Promise.resolve().then(() => control.cancelled ? undefined : request())
    return Promise.race([response, cancelled]).finally(() => {
        clearTimeout(timer)
        delete control.cancel
        delete control.cancelTransport
    })
}

export const startDeviceActivation = ({ getDeviceCode, getDeviceAuth, onCode, onSession, onError }) => {
    let current
    let stopped = false
    let renewalTimer
    let slowDownMs = 0
    let retryNotBefore = 0

    const clear = () => {
        clearTimeout(renewalTimer)
        const old = current
        current = null
        if (old) {
            clearTimeout(old.pollTimer)
            clearTimeout(old.expiryTimer)
            old.request?.cancel?.()
        }
    }
    const stop = () => {
        stopped = true
        clear()
    }
    const fail = error => {
        stop()
        onError(error)
    }

    const deferIfRateLimited = (error, request, interval) => {
        const status = request.httpStatus ?? error?.httpStatus
        const slowed = status === 429 || error?.code === 'slow_down' || error?.message === 'slow_down'
        const now = Date.now()
        const retryAfter = retryAfterMs(request.retryAfter, now)
        if (!slowed && !(status === 503 && retryAfter !== null)) {
            return false
        }
        if (slowed) {
            slowDownMs += SLOW_DOWN_INCREMENT_MS
        }
        retryNotBefore = Math.max(retryNotBefore, now + Math.max(interval + slowDownMs, retryAfter ?? 0))
        return true
    }

    async function activate() {
        if (stopped) {
            return
        }
        clear()
        onCode(null)
        const wait = retryNotBefore - Date.now()
        if (wait > 0) {
            renewalTimer = setTimeout(() => activate().catch(fail), Math.min(wait, MAX_TIMER_MS))
            return
        }
        const attempt = { request: {} }
        current = attempt
        let device
        try {
            device = await getDeviceCode(attempt.request)
        } catch (error) {
            if (current === attempt) {
                if (deferIfRateLimited(error, attempt.request, DEFAULT_INTERVAL_MS)) {
                    activate().catch(fail)
                } else {
                    fail(error)
                }
            }
            return
        }
        if (current !== attempt) {
            return
        }
        const lifetime = Number(device?.expires_in) * 1000
        if (!device?.user_code || !device.device_code || !Number.isFinite(lifetime) || lifetime <= 0) {
            fail(new Error('Invalid activation response'))
            return
        }
        const expiresAt = Date.now() + lifetime
        // This endpoint supplies the polling interval in milliseconds, as used by the original client.
        const rawInterval = Number(device.interval)
        const interval = Number.isFinite(rawInterval) && rawInterval > 0
            ? Math.ceil(rawInterval)
            : DEFAULT_INTERVAL_MS
        const renew = () => {
            if (current === attempt) {
                activate().catch(fail)
            }
        }
        function schedule() {
            const now = Date.now()
            const delay = Math.max(interval + slowDownMs, retryNotBefore - now)
            if (current === attempt && now + delay < expiresAt) {
                attempt.pollTimer = setTimeout(poll, delay)
            }
        }
        async function poll() {
            if (current !== attempt || Date.now() >= expiresAt) {
                renew()
                return
            }
            const request = {}
            attempt.request = request
            try {
                const session = await getDeviceAuth(device.device_code, request)
                if (current !== attempt) {
                    return
                }
                if (Date.now() >= expiresAt) {
                    renew()
                } else if (session) {
                    stop()
                    await onSession(session)
                } else {
                    schedule()
                }
            } catch (error) {
                if (current === attempt) {
                    if (deferIfRateLimited(error, request, interval) || error?.retry) {
                        schedule()
                    } else {
                        fail(error)
                    }
                } else if (stopped && !request.cancelled) {
                    onError(error)
                }
            }
        }
        onCode(device.user_code)
        attempt.expiryTimer = setTimeout(renew, lifetime)
        schedule()
    }
    activate().catch(fail)
    return stop
}
