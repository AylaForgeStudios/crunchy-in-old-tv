// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.
import { onWindowReady } from '@enact/core/snapshot'
import { error } from '@enact/webos/pmloglib'

// Logs any uncaught exceptions to the system logs for future troubleshooting. Payload can be
// customized by the application for its particular requirements.
const handleError = (ev) => {
    error('app.onerror', {
        line: ev.lineno,
        column: ev.colno,
    }, '')
    ev.preventDefault()
};

onWindowReady(() => {
    window.addEventListener('error', handleError)
})
