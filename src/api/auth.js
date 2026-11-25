// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.

import 'webostvjs'
import { localStore, api } from 'crunchyroll-js-api'
import { translateError } from '../api/utils'
import logger from '../logger'
import { runDeviceRequest } from './deviceActivation'

/**
 * @typedef ApiStorageSub
 * @type {Object}
 * @property {Date} installed
 * @property {Date} nextDonation
 * @typedef {ApiStorageSub & import('crunchyroll-js-api').Types.Storage} ApiStorage
 */

/** @type {ApiStorage} */
const storage = localStore.storage

export const hasSession = () => Boolean(storage.token)

/**
 * Send a login request
 * @returns {Promise<import('crunchyroll-js-api').Types.TokenObj>}
 */
export const login = async () => {
    let token = null
    try {
        token = await localStore.getToken()
    } catch (error) {
        await translateError(error)
    }
    return token
}

/**
 * Send logout
 * @returns {Promise}
 */
export const logout = async () => {
    try {
        await localStore.revokeToken()
    } catch (error) {
        // A failed remote revocation must not prevent removing the local session.
        logger.error(error)
    } finally {
        await localStore.setNewData({ token: null, account: null, cms: null })
    }
}

/**
 * switch Profile
 * @param {String} profileId
 * @returns {Promise}
 */
export const switchProfile = async (profileId) => {
    try {
        await localStore.switchProfile(profileId)
    } catch (error) {
        await translateError(error)
    }
}

/**
 * get device code
 * @returns {Promise<import('crunchyroll-js-api').Types.DeviceCode>}
 */
export const getDeviceCode = control => runDeviceRequest(control, () =>
    api.auth.getDeviceCode({ fnConfig: { cache: false, priority: true, control } }))

/**
 * get device code
 * @returns {Promise<import('crunchyroll-js-api').Types.Token>}
 */
export const getDeviceAuth = (deviceCode, control) => runDeviceRequest(control, async () => {
    try {
        const out = await api.auth.getDeviceAuth({
            device: storage.device, deviceCode, fnConfig: { cache: false, priority: true, control, activationPoll: true },
        })
        if (out?.error === 'slow_down' || out?.code === 'slow_down') {
            throw new Error('slow_down')
        }
        if (control.invalidJson || (out !== null && (typeof out?.access_token !== 'string' || !out.access_token))) {
            throw new Error('Invalid activation response')
        }
        return out
    } catch (error) {
        if (control.httpStatus !== 429 && control.httpStatus !== 503 &&
            (error?.code === 'authorization_pending' || error?.message === 'authorization_pending')) {
            return null
        }
        throw error
    }
})

export const saveDeviceSession = token => localStore.saveToken(token)
