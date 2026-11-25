// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.
/* Run with Node 0.12.2 against the compiled service entry point. */
var assert = require('assert')
var Module = require('module')
var path = require('path')
var zlib = require('zlib')
var entry = path.resolve(process.argv[2])
var callbacks = {}
var calls = []
var responses = []
var originalLoad = Module._load

function MockService() {}
MockService.prototype.register = function(name, request, cancel) {
    callbacks[name] = { request: request, cancel: cancel }
}

Module._load = function(name) {
    if (name === 'webos-service') {
        return MockService
    }
    if (name === 'node-fetch') {
        return function(_url, options) {
            return new Promise(function(resolve) {
                calls.push({ options: options, resolve: resolve })
            })
        }
    }
    return originalLoad.apply(this, arguments)
}
try {
    require(entry)
} finally {
    Module._load = originalLoad
}

function message(id) {
    var config = { url: 'https://fixture.invalid', id: id, timeout: 1500 }
    return {
        isSubscription: true,
        uniqueToken: id,
        payload: { buffered: true, d: zlib.gzipSync(new Buffer(JSON.stringify(config))).toString('base64') },
        respond: function(response) { responses.push(response) }
    }
}

function answer(request) {
    request.resolve({
        status: 200,
        headers: { forEach: function() {} },
        arrayBuffer: function() { return Promise.resolve(new Buffer('fixture-ok')) }
    })
}

var handler = callbacks.forwardRequest0
var cancelledBeforeDispatch = message('early')
handler.cancel(cancelledBeforeDispatch)
handler.request(cancelledBeforeDispatch)
assert.equal(calls.length, 0)

var cancelledInFlight = message('in-flight')
handler.request(cancelledInFlight)
assert.equal(calls.length, 1)
assert.equal(calls[0].options.signal.aborted, false)
handler.cancel(cancelledInFlight)
assert.equal(calls[0].options.signal.aborted, true)
answer(calls[0])

handler.request(message('success'))
assert.equal(calls.length, 2)
assert.equal(calls[1].options.agent({protocol: 'https:'}).options.rejectUnauthorized, true)
assert.throws(function() { calls[1].options.agent({protocol: 'http:'}) })
answer(calls[1])

setImmediate(function() {
    assert.equal(responses.length, 1)
    assert.equal(responses[0].status, 200)
    assert.equal(zlib.gunzipSync(new Buffer(responses[0].content, 'base64')).toString(), 'fixture-ok')
    console.log('Buffered Luna fixture passed: early cancellation, transport abort, stale reply suppression, HTTPS and successful response.')
})
