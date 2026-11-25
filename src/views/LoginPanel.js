// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.

import { useCallback, useEffect, useState } from 'react'
import { Row, Column } from '@enact/ui/Layout'
import { Header, Panel } from '@enact/moonstone/Panels'
import Heading from '@enact/moonstone/Heading'
import Button from '@enact/moonstone/Button'

import { useSetRecoilState, useRecoilState } from 'recoil'

import { LoginWithCode, LoginWithQR } from '../components/login/Login'
import { ContactMeBtn, AppConfigBtn } from '../components/Buttons'
import PopupMessage from '../components/Popup'
import { autoLoginState, isPremiumState } from '../recoilConfig'
import api from '../api'
import { $L } from '../hooks/language'
import { useNavigate } from '../hooks/navigate'
import { requestErrorMessage } from '../requestError'
import { startDeviceActivation } from '../api/deviceActivation'

const LoginPanel = ({ ...rest }) => {
    const { jumpTo } = useNavigate()
    /** @type {Function} */
    const setPremiumState = useSetRecoilState(isPremiumState)
    /** @type {[Boolean, Function]}  */
    const [autoLogin, setAutoLogin] = useRecoilState(autoLoginState)
    /** @type {[String, Function]}  */
    const [message, setErrorMessage] = useState('')
    const [useQr, setUseQr] = useState(true)
    const [activationAttempt, setActivationAttempt] = useState(0)
    /** @type {[String, Function]} */
    const [deviceCode, setDeviceCode] = useState(null)

    /** @type {Function} */
    const makeLogin = useCallback(async () => {
        await api.auth.login()
        const account = await api.account.getAccount()
        const benefits = await api.subscription.getUserBenefits(account)
        setPremiumState(benefits.items.some(item => item.benefit === 'cr_premium'))
        setAutoLogin(true)
        jumpTo('/profiles')
    }, [setAutoLogin, setPremiumState, jumpTo])

    const selectMethod = useCallback(ev => {
        setUseQr((ev.currentTarget || ev.target).dataset.method === 'qr')
        if (message) {
            setActivationAttempt(attempt => attempt + 1)
            setErrorMessage('')
        }
    }, [message])

    useEffect(() => {
        let cancelled = false
        let stopActivation
        const onError = (error) => {
            if (!cancelled) {
                setDeviceCode(null)
                setErrorMessage(requestErrorMessage(error, $L('An error occurred')))
            }
        }
        const signIn = async () => {
            if (activationAttempt === 0 && autoLogin && api.auth.hasSession()) {
                try {
                    await makeLogin()
                    return
                } catch (_error) {
                    // Start device activation if the saved session cannot be restored.
                }
            }
            if (!cancelled) {
                stopActivation = startDeviceActivation({
                    getDeviceCode: api.auth.getDeviceCode,
                    getDeviceAuth: api.auth.getDeviceAuth,
                    onCode: setDeviceCode,
                    onSession: async session => {
                        await api.auth.saveDeviceSession(session)
                        if (!cancelled) {
                            await makeLogin()
                        }
                    },
                    onError,
                })
            }
        }
        signIn().catch(onError)
        return () => {
            cancelled = true
            stopActivation?.()
        }
    }, [activationAttempt, autoLogin, makeLogin])

    return (
        <Panel {...rest}>
            <Header type='compact' hideLine>
                <AppConfigBtn />
                <ContactMeBtn />
            </Header>
            <Column>
                <Row align='center center'>
                    <Heading size="large">{$L('Login')}</Heading>
                </Row>
                <Row align='center center' style={{ marginBottom: '0.6rem' }}>
                    <Button data-method='qr' onClick={selectMethod}>{$L('QR code')}</Button>
                    <Button data-method='code' onClick={selectMethod}>{$L('Code')}</Button>
                </Row>
                <Row align='center center'>
                    {useQr ? (
                        <LoginWithQR deviceCode={deviceCode} />
                    ) : (
                        <LoginWithCode deviceCode={deviceCode} />
                    )}
                </Row>
            </Column>
            <PopupMessage show={!!message} type='error'>
                {message}
            </PopupMessage>
        </Panel>
    )
}

export default LoginPanel
