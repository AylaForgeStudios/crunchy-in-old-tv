// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.

import { api } from 'crunchyroll-js-api'
import { translateError, getContentParam } from './utils'


/**
 * Get object data
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {String} params.contentId
 * @param {String} params.contentType
 * @return {Promise<import('crunchyroll-js-api').Types.RatingStars>}
 */
export const getRatings = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.review.getRatings({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}

/**
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {String} params.contentId
 * @param {String} params.rating
 * @param {String} params.contentType
 * @return {Promise<import('crunchyroll-js-api').Types.RatingStars>}
 */
export const updateRating = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.review.addRating({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}


/**
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {String} params.contentId
 * @param {String} params.rating
 * @param {String} params.contentType
 * @returns {Promise<import('../types').RatingStars>}
 */
export const updateEpisodeRating = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.review.addEpisodeRating({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}

/**
 * @param {import('crunchyroll-js-api').Types.Profile} profile
 * @param {Object} params
 * @param {String} params.contentId
 * @param {String} params.contentType
 * @returns {Promise<import('../types').RatingStars>}
 */
export const removeRating = async (profile, params) => {
    let out = null
    try {
        const account = await getContentParam(profile)
        out = await api.review.removeRating({ account, ...params })
    } catch (error) {
        await translateError(error)
    }
    return out
}
