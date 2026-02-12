import { resolve4 } from 'node:dns/promises'
import { connect as tlsConnect } from 'node:tls'


class HttpPreCheck {


    static async check( { endpoint, timeout } ) {
        const messages = []

        const categories = {
            isHttpReachable: false,
            isHttps: false,
            hasValidSsl: false,
            hasSslCertificate: false,
            hasRedirects: false,
            isWebsite: false,
            isApiEndpoint: false,
            hasServerHeader: false,
            supportsCors: false,
            supportsHttp2: false
        }

        const entries = {
            protocol: null,
            statusCode: null,
            redirectCount: 0,
            redirectChain: [],
            contentType: null,
            serverHeader: null,
            responseTimeMs: null,
            sslProtocol: null,
            sslIssuer: null,
            sslExpiresAt: null,
            ipAddress: null
        }

        const url = new URL( endpoint )
        const { hostname } = url
        const isHttps = url.protocol === 'https:'

        entries[ 'protocol' ] = isHttps ? 'https' : 'http'
        categories[ 'isHttps' ] = isHttps

        const { ipAddress } = await HttpPreCheck.#resolveDns( { hostname } )

        if( ipAddress === null ) {
            messages.push( `HTTP-001 dns: DNS resolution failed for ${hostname}` )

            return { messages, categories, entries }
        }

        entries[ 'ipAddress' ] = ipAddress

        if( isHttps ) {
            const port = url.port ? Number( url.port ) : 443
            const { sslResult } = await HttpPreCheck.#checkSsl( { hostname, port, timeout } )

            categories[ 'hasSslCertificate' ] = sslResult[ 'hasCertificate' ]

            if( sslResult[ 'hasCertificate' ] ) {
                entries[ 'sslProtocol' ] = sslResult[ 'protocol' ]
                entries[ 'sslIssuer' ] = sslResult[ 'issuer' ]
                entries[ 'sslExpiresAt' ] = sslResult[ 'expiresAt' ]
            }

            if( sslResult[ 'isValid' ] ) {
                categories[ 'hasValidSsl' ] = true
            } else if( sslResult[ 'errorCode' ] === 'CERT_HAS_EXPIRED' ) {
                messages.push( 'HTTP-005 ssl: SSL certificate expired' )
            } else if( sslResult[ 'errorCode' ] === 'DEPTH_ZERO_SELF_SIGNED_CERT' || sslResult[ 'errorCode' ] === 'SELF_SIGNED_CERT_IN_CHAIN' ) {
                messages.push( 'HTTP-006 ssl: SSL certificate self-signed' )
            }

            if( sslResult[ 'alpnProtocol' ] === 'h2' ) {
                categories[ 'supportsHttp2' ] = true
                messages.push( 'HTTP-013 http2: HTTP/2 supported' )
            }
        } else {
            messages.push( 'HTTP-004 protocol: HTTP instead of HTTPS' )
        }

        const { fetchResult } = await HttpPreCheck.#fetchEndpoint( { endpoint, timeout } )

        if( fetchResult[ 'error' ] ) {
            if( fetchResult[ 'errorType' ] === 'timeout' ) {
                messages.push( 'HTTP-003 connection: Connection timeout' )
            } else {
                messages.push( 'HTTP-002 connection: Connection refused' )
            }

            return { messages, categories, entries }
        }

        categories[ 'isHttpReachable' ] = true
        entries[ 'statusCode' ] = fetchResult[ 'statusCode' ]
        entries[ 'responseTimeMs' ] = fetchResult[ 'responseTimeMs' ]
        entries[ 'redirectCount' ] = fetchResult[ 'redirectChain' ].length
        entries[ 'redirectChain' ] = fetchResult[ 'redirectChain' ]
        entries[ 'contentType' ] = fetchResult[ 'contentType' ]
        entries[ 'serverHeader' ] = fetchResult[ 'serverHeader' ]

        if( fetchResult[ 'redirectChain' ].length > 0 ) {
            categories[ 'hasRedirects' ] = true
            messages.push( `HTTP-007 redirect: ${fetchResult[ 'redirectChain' ].length} redirect(s) detected` )

            if( fetchResult[ 'redirectChain' ].length > 5 ) {
                messages.push( 'HTTP-008 redirect: Too many redirects (>5)' )
            }
        }

        const contentType = ( fetchResult[ 'contentType' ] || '' ).toLowerCase()

        if( contentType.includes( 'text/html' ) ) {
            categories[ 'isWebsite' ] = true
            messages.push( 'HTTP-009 content: Website detected (HTML response)' )
        } else if( contentType.includes( 'application/json' ) || contentType.includes( 'application/xml' ) || contentType.includes( 'text/xml' ) ) {
            categories[ 'isApiEndpoint' ] = true
            messages.push( 'HTTP-010 content: API endpoint detected' )
        }

        if( fetchResult[ 'serverHeader' ] ) {
            categories[ 'hasServerHeader' ] = true
            messages.push( `HTTP-011 server: Server header detected — ${fetchResult[ 'serverHeader' ]}` )
        }

        if( fetchResult[ 'corsHeader' ] ) {
            categories[ 'supportsCors' ] = true
            messages.push( 'HTTP-012 cors: CORS supported' )
        }

        return { messages, categories, entries }
    }


    static async #resolveDns( { hostname } ) {
        const isIpv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test( hostname )

        if( isIpv4 ) {
            return { ipAddress: hostname }
        }

        try {
            const addresses = await resolve4( hostname )
            const ipAddress = addresses.length > 0 ? addresses[ 0 ] : null

            return { ipAddress }
        } catch( _error ) {
            return { ipAddress: null }
        }
    }


    static async #checkSsl( { hostname, port, timeout } ) {
        const sslResult = await new Promise( ( resolve ) => {
            const socket = tlsConnect(
                {
                    host: hostname,
                    port,
                    servername: hostname,
                    rejectUnauthorized: false,
                    ALPNProtocols: [ 'h2', 'http/1.1' ],
                    timeout
                },
                () => {
                    const cert = socket.getPeerCertificate()
                    const isAuthorized = socket.authorized || false
                    const authError = socket.authorizationError || null
                    const protocol = socket.getProtocol ? socket.getProtocol() : null
                    const alpnProtocol = socket.alpnProtocol || null

                    const hasCertificate = cert && Object.keys( cert ).length > 0
                    const issuer = hasCertificate && cert.issuer
                        ? ( cert.issuer.O || cert.issuer.CN || null )
                        : null
                    const expiresAt = hasCertificate && cert.valid_to
                        ? new Date( cert.valid_to ).toISOString()
                        : null

                    socket.destroy()

                    resolve( {
                        hasCertificate,
                        isValid: isAuthorized,
                        errorCode: authError,
                        protocol,
                        issuer,
                        expiresAt,
                        alpnProtocol
                    } )
                }
            )

            socket.on( 'error', ( error ) => {
                resolve( {
                    hasCertificate: false,
                    isValid: false,
                    errorCode: error.code || null,
                    protocol: null,
                    issuer: null,
                    expiresAt: null,
                    alpnProtocol: null
                } )
            } )

            socket.on( 'timeout', () => {
                socket.destroy()

                resolve( {
                    hasCertificate: false,
                    isValid: false,
                    errorCode: 'TIMEOUT',
                    protocol: null,
                    issuer: null,
                    expiresAt: null,
                    alpnProtocol: null
                } )
            } )
        } )

        return { sslResult }
    }


    static async #fetchEndpoint( { endpoint, timeout } ) {
        const startTime = Date.now()
        const controller = new AbortController()
        const timeoutId = setTimeout( () => { controller.abort() }, timeout )

        try {
            const { redirectChain, response } = await HttpPreCheck.#followRedirects( {
                url: endpoint,
                controller,
                redirectChain: [],
                remaining: 10
            } )

            clearTimeout( timeoutId )

            const fetchResult = {
                error: false,
                statusCode: response.status,
                responseTimeMs: Date.now() - startTime,
                redirectChain,
                contentType: response.headers.get( 'content-type' ) || null,
                serverHeader: response.headers.get( 'server' ) || null,
                corsHeader: response.headers.get( 'access-control-allow-origin' ) || null
            }

            return { fetchResult }
        } catch( error ) {
            clearTimeout( timeoutId )

            const errorType = error.name === 'AbortError' ? 'timeout' : 'connection'

            const fetchResult = {
                error: error.message || 'Unknown error',
                errorType
            }

            return { fetchResult }
        }
    }


    static async #followRedirects( { url, controller, redirectChain, remaining } ) {
        const response = await fetch( url, {
            method: 'GET',
            redirect: 'manual',
            signal: controller.signal,
            headers: {
                'User-Agent': 'MCP-Agent-Assessment/1.0',
                'Accept': 'text/html, application/xhtml+xml, */*'
            }
        } )

        const statusCode = response.status
        const isRedirect = statusCode >= 300 && statusCode < 400
        const location = response.headers.get( 'location' )

        if( !isRedirect || !location || remaining <= 0 ) {
            return { redirectChain, response }
        }

        const resolvedLocation = new URL( location, url ).href

        redirectChain.push( {
            from: url,
            to: resolvedLocation,
            statusCode
        } )

        return HttpPreCheck.#followRedirects( {
            url: resolvedLocation,
            controller,
            redirectChain,
            remaining: remaining - 1
        } )
    }
}


export { HttpPreCheck }
