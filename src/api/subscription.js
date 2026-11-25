// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.

import 'webostvjs'
import { api, localStore } from 'crunchyroll-js-api'
import { ERROR_CODES } from '../const'
import { translateError } from '../api/utils'


/**
 * Return user's benifits
 * @param {import('crunchyroll-js-api').Types.AccountObj} account
 * @returns {Promise<{items: Array<{benefit: String}>}>}
 */
export const getUserBenefits = async (account) => {
    let out
    try {
        const token = await localStore.getToken()
        out = await api.subscription.getUserBenefits({
            auth: { token: `${token.tokenType} ${token.accessToken}`, locale: 'en' },
            externalId: account.externalId,
        })
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Forbidden'
                || error.httpStatusText === 'Forbidden'
                || error.code === ERROR_CODES.subscription_not_found) {
                out = { items: [] }
            } else {
                await translateError(error)
            }
        } else {
            await translateError(error)
        }
    }
    return out
}
