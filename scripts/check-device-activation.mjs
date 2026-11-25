// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runDeviceRequest, startDeviceActivation } from '../src/api/deviceActivation.js'

const flush = async () => {
    for (let i = 0; i < 40; i++) {
        await Promise.resolve()
    }
}

const advance = async (clock, ms) => {
    clock.tick(ms)
    await flush()
}

const device = (id, lifetime, interval = 5000) => ({ device_code: id, user_code: id, expires_in: lifetime, interval })

test('the LG values schedule the first poll at 500 ms and never overlap', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    const calls = []
    let resolveFirst
    let handoffs = 0
    const stop = startDeviceActivation({
        getDeviceCode: async () => device('mock', 300, 500),
        getDeviceAuth: () => {
            calls.push(Date.now())
            return calls.length === 1 ? new Promise(resolve => { resolveFirst = resolve }) : Promise.resolve({})
        },
        onCode() {},
        onSession() { handoffs++ },
        onError: assert.fail,
    })
    t.after(stop)
    await flush()
    await advance(t.mock.timers, 499)
    assert.deepEqual(calls, [])
    await advance(t.mock.timers, 1)
    assert.deepEqual(calls, [500])
    await advance(t.mock.timers, 800)
    assert.deepEqual(calls, [500])
    resolveFirst(null)
    await flush()
    await advance(t.mock.timers, 499)
    assert.deepEqual(calls, [500])
    await advance(t.mock.timers, 1)
    assert.deepEqual(calls, [500, 1800])
    assert.equal(handoffs, 1)
})

test('429 respects Retry-After in seconds and slow_down increases the subsequent interval', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    const calls = []
    const stop = startDeviceActivation({
        getDeviceCode: async () => device('mock', 300, 500),
        getDeviceAuth: async (_id, control) => {
            calls.push(Date.now())
            if (calls.length === 1) {
                control.httpStatus = 429
                control.retryAfter = '8'
                throw new Error('Synthetic HTTP failure')
            }
            if (calls.length === 2) {
                throw new Error('slow_down')
            }
            return null
        },
        onCode() {},
        onSession: assert.fail,
        onError: assert.fail,
    })
    t.after(stop)
    await flush()
    await advance(t.mock.timers, 500)
    await advance(t.mock.timers, 7999)
    assert.deepEqual(calls, [500])
    await advance(t.mock.timers, 1)
    await advance(t.mock.timers, 10499)
    assert.deepEqual(calls, [500, 8500])
    await advance(t.mock.timers, 1)
    await advance(t.mock.timers, 10500)
    assert.deepEqual(calls, [500, 8500, 19000, 29500])
})

test('Retry-After as an HTTP date survives QR expiry and delays renewal', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    const issues = []
    const polls = []
    const stop = startDeviceActivation({
        getDeviceCode: async () => {
            issues.push(Date.now())
            return device(issues.length, issues.length === 1 ? 3 : 60, 500)
        },
        getDeviceAuth: async (id, control) => {
            polls.push([id, Date.now()])
            if (id === 1) {
                control.httpStatus = 429
                control.retryAfter = new Date(9000).toUTCString()
                throw new Error('Synthetic HTTP failure')
            }
            return {}
        },
        onCode() {},
        onSession() {},
        onError: assert.fail,
    })
    t.after(stop)
    await flush()
    await advance(t.mock.timers, 500)
    await advance(t.mock.timers, 2500)
    await advance(t.mock.timers, 5999)
    assert.deepEqual(issues, [0])
    assert.deepEqual(polls, [[1, 500]])
    await advance(t.mock.timers, 1)
    assert.deepEqual(issues, [0, 9000])
    await advance(t.mock.timers, 5500)
    assert.deepEqual(polls, [[1, 500], [2, 14500]])
})

test('a pending poll is followed by a successful, single session handoff', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    let calls = 0
    let handoffs = 0
    const stop = startDeviceActivation({
        getDeviceCode: async () => device('mock', 60),
        getDeviceAuth: async () => ++calls === 1 ? null : {},
        onCode() {},
        onSession() { handoffs++ },
        onError: assert.fail,
    })
    t.after(stop)
    await flush()
    await advance(t.mock.timers, 5000)
    await advance(t.mock.timers, 5000)
    await advance(t.mock.timers, 90000)
    assert.equal(calls, 2)
    assert.equal(handoffs, 1)
})

test('expiry cancels a blocked poll, renews the QR and discards the old reply', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    let issued = 0
    let aborts = 0
    let handoffs = 0
    let completeOld
    const polled = []
    const stop = startDeviceActivation({
        getDeviceCode: async () => device(++issued, 12),
        getDeviceAuth: (id, control) => runDeviceRequest(control, () => {
            polled.push(id)
            if (id === 1) {
                control.cancelTransport = () => { aborts++ }
                return new Promise(resolve => { completeOld = resolve })
            }
            return {}
        }),
        onCode() {},
        onSession() { handoffs++ },
        onError: assert.fail,
    })
    t.after(stop)
    await flush()
    await advance(t.mock.timers, 5000)
    assert.deepEqual(polled, [1])
    await advance(t.mock.timers, 7000)
    assert.equal(aborts, 1)
    assert.equal(issued, 2)
    completeOld({})
    await flush()
    assert.equal(handoffs, 0)
    await advance(t.mock.timers, 5000)
    assert.deepEqual(polled, [1, 2])
    assert.equal(handoffs, 1)
})

test('the request deadline lets polling resume without waiting for the abandoned promise', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    let calls = 0
    let inFlight = 0
    const stop = startDeviceActivation({
        getDeviceCode: async () => device('mock', 90),
        getDeviceAuth: (_id, control) => runDeviceRequest(control, () => {
            assert.equal(inFlight, 0)
            calls++
            inFlight++
            control.cancelTransport = () => { inFlight-- }
            return new Promise(() => {})
        }),
        onCode() {},
        onSession: assert.fail,
        onError: assert.fail,
    })
    t.after(stop)
    await flush()
    await advance(t.mock.timers, 5000)
    await advance(t.mock.timers, 20000)
    assert.equal(inFlight, 0)
    await advance(t.mock.timers, 5000)
    assert.equal(calls, 2)
    assert.equal(inFlight, 1)
    stop()
    assert.equal(inFlight, 0)
})

// Exercise the production functions with synthetic dependencies and no TV or HTTP.
const transportSource = readFileSync(new URL('../src/hooks/customFetch.js', import.meta.url), 'utf8')
const loadTransportFunction = (name, next, dependencies) => {
    const start = transportSource.indexOf(`const ${name} =`)
    const end = transportSource.lastIndexOf('/**', transportSource.indexOf(`const ${next} =`, start))
    const factory = new Function(...Object.keys(dependencies), transportSource.slice(start, end) + `\nreturn ${name}`)
    return factory(...Object.values(dependencies))
}

const fixtureDeviceAuth = (replies) => {
    let parseCalls = 0
    const requests = []
    const logger = { debug() {}, error() {} }
    class FixtureResponse {
        constructor(content, options) {
            this.content = content
            this.status = options.status
            this.statusText = options.statusText
        }
        async json() {
            parseCalls++
            return JSON.parse(this.content ?? '')
        }
    }
    const makeResponseHandle = loadTransportFunction('makeResponseHandle', 'customFetch', {
        logger,
        utils: { decodeResponseAsync: async ({ content }) => content },
        makeFetchProgressXHR: () => () => {},
        ResponseHack: FixtureResponse,
    })
    const fetchStart = transportSource.indexOf('const customFetch =')
    const fetchEnd = transportSource.indexOf('const useCustomFetch =', fetchStart)
    const customFetch = new Function('setUpRequest', 'makeResponseHandle', 'makeRequest',
        transportSource.slice(fetchStart, fetchEnd) + '\nreturn customFetch')(
        url => ({ url }),
        makeResponseHandle,
        request => {
            requests.push(Date.now())
            assert.ok(replies.length, 'unexpected extra activation request')
            return request.onSuccess(replies.shift())
        }
    )
    // The provider is unavailable. Exercise the production transport and auth wrapper
    // with a local response parser that models the provider contract.
    const readFixtureResponse = async (fnConfig) => {
        const response = await customFetch('https://fixture.invalid', {}, fnConfig)
        const payload = await response.json().catch(() => null)
        if (response.status >= 400) {
            throw Object.assign(new Error(payload?.error || response.statusText), { httpStatus: response.status })
        }
        return payload
    }
    const authSource = readFileSync(new URL('../src/api/auth.js', import.meta.url), 'utf8')
    const authStart = authSource.indexOf('const getDeviceAuth =')
    const authEnd = authSource.indexOf('export const saveDeviceSession', authStart)
    const getDeviceAuth = new Function('api', 'storage', 'runDeviceRequest',
        authSource.slice(authStart, authEnd) + '\nreturn getDeviceAuth')(
        { auth: { getDeviceAuth: ({ fnConfig }) => readFixtureResponse(fnConfig) } },
        { device: {} },
        runDeviceRequest
    )
    return { getDeviceAuth, makeResponseHandle, requests, parseCalls: () => parseCalls }
}

test('three HTTP 204 polls keep the same QR and skip parsing until authorization succeeds', async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    const fixture = fixtureDeviceAuth([
        { status: 204 }, { status: 204 }, { status: 204 },
        { status: 200, content: JSON.stringify({ access_token: 'synthetic-session' }) },
    ])
    const codes = []
    let handoffs = 0
    const stop = startDeviceActivation({
        getDeviceCode: async () => device('fixture', 300, 500),
        getDeviceAuth: fixture.getDeviceAuth,
        onCode: code => codes.push(code),
        onSession: session => {
            assert.equal(session.access_token, 'synthetic-session')
            handoffs++
        },
        onError: assert.fail,
    })
    t.after(stop)
    await flush()
    for (let i = 0; i < 3; i++) {
        await advance(t.mock.timers, 500)
        assert.deepEqual(codes, [null, 'fixture'])
        assert.equal(fixture.parseCalls(), 0)
        assert.equal(handoffs, 0)
    }
    await advance(t.mock.timers, 500)
    assert.deepEqual(fixture.requests, [500, 1000, 1500, 2000])
    assert.equal(fixture.parseCalls(), 1)
    assert.equal(handoffs, 1)
})

test('a malformed or empty HTTP 200 session and a real HTTP error still reject', async () => {
    const fixture = fixtureDeviceAuth([
        { status: 200, content: '{' },
        { status: 200, content: '{"access_token":""}' },
        { status: 401, content: '{"error":"invalid_grant"}' },
    ])
    await assert.rejects(fixture.getDeviceAuth('fixture', {}), /Invalid activation response/)
    await assert.rejects(fixture.getDeviceAuth('fixture', {}), /Invalid activation response/)
    await assert.rejects(fixture.getDeviceAuth('fixture', {}), { message: 'invalid_grant', httpStatus: 401 })
    assert.equal(fixture.parseCalls(), 3)
})

test('HTTP 204 outside the activation poll does not override JSON parsing', async () => {
    const fixture = fixtureDeviceAuth([])
    const control = {}
    const handle = fixture.makeResponseHandle({ config: {}, control })
    await handle.onSuccess({ status: 204 })
    await assert.rejects((await handle.prom).json(), SyntaxError)
    assert.equal(control.invalidJson, true)
    assert.equal(fixture.parseCalls(), 1)
})

test('an encoding rejection reaches the request failure callback', async () => {
    const failure = new Error('Synthetic encoding failure')
    const makeRequest = loadTransportFunction('makeRequest', 'makeResponseHandle', {
        uuidv4: () => 'synthetic-id',
        getCacheEntry: async () => null,
        utils: { encodeRequestAsync: async () => { throw failure } },
        getSlot: assert.fail,
        _makeRequest: assert.fail,
    })
    await assert.rejects(new Promise((resolve, reject) => {
        makeRequest({ config: { body: 'fixture' }, onSuccess: resolve, onFailure: reject }, { cache: false })
    }), failure)
})

test('a body decoding rejection settles the public response promise', async () => {
    const failure = new Error('Synthetic decoding failure')
    const makeResponseHandle = loadTransportFunction('makeResponseHandle', 'customFetch', {
        logger: { debug() {}, error() {} },
        utils: { decodeResponseAsync: async () => { throw failure } },
        makeFetchProgressXHR: () => () => {},
    })
    const handle = makeResponseHandle({ config: {} })
    const outcome = assert.rejects(handle.prom, failure)
    await handle.onSuccess({ status: 200, content: 'fixture' })
    await outcome
})

test('invalid JSON is marked separately from a valid JSON null', async () => {
    class FixtureResponse {
        json() { return this.invalid ? Promise.reject(new SyntaxError('Fixture')) : Promise.resolve(null) }
    }
    const makeResponseHandle = loadTransportFunction('makeResponseHandle', 'customFetch', {
        logger: { debug() {}, error() {} },
        utils: {},
        makeFetchProgressXHR: () => () => {},
        ResponseHack: FixtureResponse,
    })
    const control = {}
    const handle = makeResponseHandle({ config: {}, control })
    await handle.onSuccess({ status: 200 })
    const response = await handle.prom
    assert.equal(await response.json(), null)
    assert.equal(control.invalidJson, undefined)
    response.invalid = true
    await assert.rejects(response.json(), SyntaxError)
    assert.equal(control.invalidJson, true)
})

test('the controlled response supplies status and Retry-After even when decoding fails', async () => {
    const failure = new Error('Synthetic decoding failure')
    const makeResponseHandle = loadTransportFunction('makeResponseHandle', 'customFetch', {
        logger: { debug() {}, error() {} },
        utils: { decodeResponseAsync: async () => { throw failure } },
        makeFetchProgressXHR: () => () => {},
    })
    const control = {}
    const handle = makeResponseHandle({ config: {}, control })
    const outcome = assert.rejects(handle.prom, failure)
    await handle.onSuccess({ status: 429, headers: { 'retry-after': '7' }, content: 'fixture' })
    await outcome
    assert.deepEqual(control, { httpStatus: 429, retryAfter: '7' })
})

test('an acquired slot is returned only once when late callbacks arrive', async () => {
    const released = []
    let successes = 0
    const failures = []
    const getSlot = loadTransportFunction('getSlot', 'getCacheEntry', {
        requestSlots: { acquire: async () => 4, release: id => released.push(id), freeSlots: new Set() },
        requestSlotsPriority: null,
        logger: { debug() {} },
    })
    const request = { onSuccess: () => successes++, onFailure: error => failures.push(error) }
    await getSlot(request, false)
    request.releaseSlot()
    request.onSuccess({})
    request.onFailure(new Error('Late result'))
    assert.deepEqual(released, [4])
    assert.equal(successes, 0)
    assert.deepEqual(failures, [])
})
