// Modified by AylaForge Studios. See docs/MODIFIED-FILES.md.

import { Component } from 'react'

import { $L } from '../hooks/language'
import ErrorPanel from '../views/ErrorPanel'
import logger from '../logger'
import { requestErrorMessage } from '../requestError'


class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
        this.promiseRejectionHandler = (event) => {
            // get uncatch promises
            event.preventDefault()
            this.componentDidCatch(event.reason)
            this.setState({ hasError: true, error: event.reason })
        }
        this.closeErrorPanel = () => {
            // back to normal use
            this.setState({ hasError: false, error: null })
        }
    }

    static getDerivedStateFromError(error) {
        // normal uncatch error
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        // logging error
        logger.error('ErrorBoundary componentDidCatch')
        if (error) {
            logger.error(error)
        }
        if (errorInfo) {
            logger.error(errorInfo)
        }
    }

    componentDidMount() {
        // Add an event listener to the window to catch unhandled promise rejections & stash the error in the state
        window.addEventListener('unhandledrejection', this.promiseRejectionHandler)
    }

    componentWillUnmount() {
        // remove event
        window.removeEventListener('unhandledrejection', this.promiseRejectionHandler);
    }

    render() {
        if (this.state.hasError) {
            const { error } = this.state
            const errorMessage = requestErrorMessage(error, $L('Unhandled error occurred'))
            const onlyClose = !!error && (!!error.retry || [408, 429, 500, 502, 503, 504].includes(error.httpStatus))
            return (
                <ErrorPanel
                    message={errorMessage}
                    closeErrorPanel={this.closeErrorPanel}
                    onlyClose={onlyClose}
                    {...this.props} />
            )
        }


        return this.props.children
    }
}

export default ErrorBoundary
