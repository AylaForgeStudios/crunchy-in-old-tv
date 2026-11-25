// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.

import 'webostvjs'
import { localStore, api } from 'crunchyroll-js-api'
import { translateError } from '../api/utils'

/**
 * Return account info
 * @returns {Promise<import('crunchyroll-js-api').Types.AccountObj>}
 */
export const getAccount = async () => {
    let account = null
    try {
        account = await localStore.getAccount()
    } catch (error) {
        await translateError(error)
    }
    return account
}

/**
 * Return profile
 * @returns {Promise<import('crunchyroll-js-api').Types.ProfileResponse>}
 */
export const getProfiles = async () => {
    /** @type {import('crunchyroll-js-api').Types.ProfileResponse} */
    let profile
    try {
        profile = await api.account.getMultiProfiles({ token: await localStore.getAuthToken() })
    } catch (error) {
        await translateError(error)
    }
    return profile
}

/**
 * create a profile
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @returns {Promise}
 */
export const createProfile = async (profile) => {
    let res
    try {
        const token = await localStore.getAuthToken()
        res = await api.account.createMultiProfile({ token, data: profile })
    } catch (error) {
        await translateError(error)
    }
    return res
}

/**
 * Update a profile
 * @param {String} profileId
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @returns {Promise}
 */
export const updateProfile = async (profileId, profile) => {
    try {
        const token = await localStore.getAuthToken()
        await api.account.updateMultiProfile({ profileId, token, data: profile })
    } catch (error) {
        await translateError(error)
    }
}

/**
 * Update a profile
 * @param {String} profileId
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @returns {Promise}
 */
export const deleteProfile = async (profileId) => {
    try {
        const token = await localStore.getAuthToken()
        await api.account.deleteMultiProfile({ profileId, token })
    } catch (error) {
        await translateError(error)
    }
}


/**
 * get usernames
 * @returns {Promise<Array<String>>}
 */
export const getUsernames = async () => {
    /** @type {{usernames: Array<String>}} */
    let resUsernames
    try {
        resUsernames = await api.account.getUsernames({ token: await localStore.getAuthToken() })
    } catch (error) {
        await translateError(error)
    }
    return resUsernames.usernames
}
