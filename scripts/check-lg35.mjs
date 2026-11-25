// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { parse } from 'acorn'
import { loadSessionData, saveSessionData } from '../src/api/sessionStorage.js'
import { requestErrorMessage } from '../src/requestError.js'

const storageKey = 'crunchyData'

test('migrates legacy data and keeps only the refresh token and device preferences', () => {
    const stored = new Map()
    globalThis.window = {
        atob,
        localStorage: {
            getItem: key => stored.get(key) ?? null,
            setItem: (key, value) => stored.set(key, value),
            removeItem: key => stored.delete(key),
        },
    }
    try {
        const legacy = {
            token: { access_token: 'access-sentinel', refresh_token: 'refresh-sentinel', token: 'bearer-sentinel' },
            credential: { username: 'test-user', password: 'password-sentinel' },
            cms: { signature: 'signature-sentinel' },
            app_config: { subtitles: 'es-419' },
            device: { id: 'test-device' },
        }
        const retained = {
            app_config: legacy.app_config,
            device: legacy.device,
            token: { refresh_token: 'refresh-sentinel' },
        }
        stored.set(storageKey, btoa(JSON.stringify(legacy)))
        assert.deepEqual(JSON.parse(loadSessionData()), retained)
        assert.deepEqual(JSON.parse(stored.get(storageKey)), retained)

        const refreshed = { ...legacy, token: { ...legacy.token, refresh_token: 'rotated' } }
        saveSessionData(JSON.stringify(refreshed))
        assert.deepEqual(JSON.parse(loadSessionData()), { ...retained, token: { refresh_token: 'rotated' } })
        saveSessionData(JSON.stringify({ ...legacy, token: null }))
        assert.deepEqual(JSON.parse(loadSessionData()), { ...retained, token: null })

        stored.set(storageKey, 'corrupt fixture')
        assert.equal(loadSessionData(), null)
        assert.equal(stored.has(storageKey), false)
    } finally {
        delete globalThis.window
    }
})

test('the application and worker bundles parse as ES5 scripts', () => {
    const files = readdirSync('dist').filter(file => file.endsWith('.js'))
    assert.ok(files.includes('main.js'))
    assert.ok(files.some(file => file.startsWith('chunk.')))
    const legacyWorkerDir = 'dist/node_modules/libass-webos-legacy/dist/legacy'
    const scripts = [
        ...files.map(file => join('dist', file)),
        ...readdirSync(legacyWorkerDir).filter(file => file.endsWith('.js'))
            .map(file => join(legacyWorkerDir, file)),
    ]
    for (const file of scripts) {
        assert.doesNotThrow(() => parse(readFileSync(file, 'utf8'), { ecmaVersion: 5 }), file)
    }
})

test('request errors show status without exposing URL, token, or response body', () => {
    const fallback = 'Request failed'
    const raw = 'https://example.invalid/manifest?token=sentinel'
    assert.equal(requestErrorMessage(new Error(raw), fallback), fallback)
    assert.equal(requestErrorMessage({ httpStatus: 403, error: raw }, fallback), 'Request failed (HTTP 403)')
    assert.equal(requestErrorMessage({ error: 'Request failed (CERT_HAS_EXPIRED)' }, fallback),
        'Request failed (CERT_HAS_EXPIRED)')
})
