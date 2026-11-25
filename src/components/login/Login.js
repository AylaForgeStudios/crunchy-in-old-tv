// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.

import { Column } from '@enact/ui/Layout'
import Heading from '@enact/moonstone/Heading'
import Spinner from '@enact/moonstone/Spinner'
import PropTypes from 'prop-types'
import { config, localStore } from 'crunchyroll-js-api'
import QRCode from 'react-qr-code'

import css from './Login.module.less'
import Field from '../Field'
import { $L } from '../../hooks/language'

/**
 * @param {Object} obj
 * @param {String} obj.deviceCode
 */
export const LoginWithCode = ({ deviceCode, ...rest }) => {

    return (
        <Column className={css.loginForm} {...rest}>
            {!deviceCode &&
                <Spinner />
            }
            {deviceCode && <>
                <Heading size='small'>{$L('Use this code to login')}</Heading>
                <Field type='text' title={$L('Access at')} size='large'>
                    {config.url + '/activate'}
                </Field>
                <Field type='text' title={$L('Enter this code')} size='small'>
                    {deviceCode}
                </Field>
                <Field type='text' title={$L('Please')}>
                    {$L('Wait till automatic login')}
                </Field>
            </>}
        </Column>
    )
}

LoginWithCode.propTypes = {
    deviceCode: PropTypes.string,
}

/**
 * @param {Object} obj
 * @param {String} obj.deviceCode
 */
export const LoginWithQR = ({ deviceCode, ...rest }) => {
    const deviceName = localStore.storage.device.name
    const url = config.url + '/activate?code=' + encodeURIComponent(deviceCode) + '&device_name=' + encodeURIComponent(deviceName)

    return (
        <Column className={css.loginForm} {...rest}>
            {!deviceCode &&
                <Spinner />
            }
            {deviceCode && <>
                <Heading size='small'>{$L('Scan qr code to login')}</Heading>
                <Field type='text' size='large'>
                    <div style={{ height: 'auto', margin: '0 auto', maxWidth: '15rem', width: '100%' }}>
                        <QRCode
                            size={256}
                            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                            value={url}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                </Field>
                <Field type='text' title={$L('Please')}>
                    {$L('Wait till automatic login')}
                </Field>
            </>}
        </Column>
    )
}

LoginWithQR.propTypes = {
    deviceCode: PropTypes.string,
}
