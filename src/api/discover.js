// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.

import { api } from 'crunchyroll-js-api'
import { translateError, getContentParam } from './utils'


/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {Number} [params.quantity] Number of records in a result
 * @param {Number} [params.start] Offset to request
 * @param {Array<String>} [params.category] Category
 * @param {String} [params.query] Search pattern
 * @param {String} [params.seasonTag] season tag
 * @param {String} [params.sort] sort results
 * @param {String} [params.type] type for search, example episode
 * @param {Boolean} [params.ratings]
 * @param {'all' | 'sub' | 'dub'} [params.viewMode]
 * @returns {Promise<{total: Number, data: Array<Object>, meta: Object}>}
 */
export const getBrowseAll = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        const newPrams = { ...params }
        if (params.viewMode === 'sub') {
            newPrams.isSubbed = true
        } else if (params.viewMode === 'dub') {
            newPrams.isDubbed = true
        }
        out = await api.discover.getBrowseAll({ account, ...newPrams })
    } catch (error) {
        await translateError(error)
    }
    return out
}

/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {Number} [params.quantity] Number of records in a result
 * @param {Number} [params.start] Offset to request
 * @param {String} [params.query] Search pattern
 * @param {Array<String>} [params.type] type for search, example episode
 * @returns {Promise<{total: Number, data: Array<Object>, meta: Object}>}
 */
export const search = async (profile, params) => {
    let out = null
    try {
        if ('type' in params) {
            if (!Array.isArray(params.type)) {
                params.type = [params.type]
            }
        }
        const account = await getContentParam(profile)
        out = await api.discover.search({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}



/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {Number} [params.contentId]
 * @returns {Promise<{total: Number, data: Array<Object>, meta: Object}>}
 */
export const getCategories = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getCategories({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}

/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {Number} [params.quantity]
 * @param {Boolean} [params.ratings]
 * @return {Promise}
 */
export const getHistory = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getHistory({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}

/**
 * Get index data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @return {Promise<{data: {total: Number, data: Array}, type: 'legacy'|'new'}>}
 */
export const getHomeFeed = async (profile) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getHomeFeed({ account, fnConfig: { cache: false } })
    } catch (error) {
        await translateError(error)
    }
    return { data: out, type: 'legacy' }
}

/**
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @return {Promise<{data: import('crunchyroll-js-api').Types.HomeItem, type: 'legacy'|'new'}>}
 */
export const getNewHomeFeed = async (profile) => {
    /** @type {import('crunchyroll-js-api').Types.HomeItem} */
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getHome({ account, fnConfig: { cache: false } })
    } catch (error) {
        await translateError(error)
    }
    return { data: out, type: 'new' }
}

/**
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {Number} params.collectionId
 * @param {Boolean} params.ratings
 * @param {Number} [params.vendor]
 * @return {Promise<{recommendations: Array}>}
 */
export const getPersonalRecomendation = async (profile, params) => {
    /** @type {import('crunchyroll-js-api').Types.HomeItem} */
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getPersonalRecomendation({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}


/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {Number} [params.quantity]
 * @param {Number} [params.start]
 * @param {Boolean} [params.ratings]
 * @return {Promise}
 */
export const getRecomendation = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getRecommendations({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}

/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {String} params.contentId
 * @param {Number} [params.quantity]
 * @param {Number} [params.start]
 * @param {Boolean} [params.ratings]
 * @return {Promise<{total: Number, data: Array<Object>, meta: Object}>}
 */
export const getSimilar = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getSimilar({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}

/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {String} params.contentId
 * @param {import('crunchyroll-js-api').Types.FetchConfig} [params.fnConfig]
 * @return {Promise<{total: Number, data: Array<Object>, meta: Object}>}
 */
export const getNext = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getNext({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    if (out?.data) {
        out.data = out.data.map(val => {
            const { panel } = val
            const newVal = { ...panel, ...val }
            delete newVal.panel
            return newVal
        })
    }
    return out
}

/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {String} params.contentId
 * @param {import('crunchyroll-js-api').Types.FetchConfig} [params.fnConfig]
 * @return {Promise<{total: Number, data: Array<Object>, meta: Object}>}
 */
export const getPrev = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getPrev({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    if (out) {
        out.data = out.data.map(val => {
            const { panel } = val
            const newVal = { ...panel, ...val }
            delete newVal.panel
            return newVal
        })
    }
    return out
}

/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {Number} [params.quantity]
 * @param {Number} [params.start]
 * @return {Promise<{total: Number, data: Array<Object>}>}
 */
export const getWatchlist = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getWatchlist({ account, fnConfig: { cache: false }, ...params, order: 'desc' })
    } catch (error) {
        await translateError(error)
    }
    if (out) {
        out.data = out.data.map(val => {
            const { panel } = val
            const newVal = { ...panel, ...val }
            delete newVal.panel
            return newVal
        })
    }
    return out
}

/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @returns {Promise<{data: Array<{id: String, localization: Object}>}>}
 */
export const getSeasonList = async (profile) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.discover.getSeasonList({ account })
    } catch (error) {
        await translateError(error)
    }
    return out
}

/**
 * Mark as watched
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {String} contentId
 * @returns {Promise>}
 */
export const markAsWatched = async (profile, contentId) => {
    try {
        const account = await getContentParam(profile)
        await api.discover.markAsWatched({ account, contentId })
    } catch (error) {
        await translateError(error)
    }
}
