import { jest } from '@jest/globals'


const mockResolve4 = jest.fn()

jest.unstable_mockModule( 'node:dns/promises', () => ( {
    resolve4: mockResolve4
} ) )

const mockTlsConnect = jest.fn()

jest.unstable_mockModule( 'node:tls', () => ( {
    connect: mockTlsConnect
} ) )

const { HttpPreCheck } = await import( '../../src/task/HttpPreCheck.mjs' )

const originalFetch = globalThis.fetch


describe( 'HttpPreCheck', () => {

    afterEach( () => {
        mockResolve4.mockReset()
        mockTlsConnect.mockReset()
        globalThis.fetch = originalFetch
    } )


    describe( 'check', () => {

        test( 'returns full result for healthy HTTPS endpoint', async () => {
            mockResolve4.mockResolvedValue( [ '93.184.216.34' ] )

            mockTlsConnect.mockImplementation( ( _options, callback ) => {
                const socket = {
                    authorized: true,
                    authorizationError: null,
                    getPeerCertificate: () => ( { issuer: { O: 'Test CA' }, valid_to: 'Jan 01 2027 00:00:00 GMT' } ),
                    getProtocol: () => 'TLSv1.3',
                    alpnProtocol: 'h2',
                    on: jest.fn(),
                    destroy: jest.fn()
                }

                process.nextTick( () => { callback() } )

                return socket
            } )

            globalThis.fetch = jest.fn().mockResolvedValue( {
                status: 200,
                headers: new Map( [
                    [ 'content-type', 'application/json' ],
                    [ 'server', 'nginx/1.24' ],
                    [ 'access-control-allow-origin', '*' ]
                ] )
            } )

            const { messages, categories, entries } = await HttpPreCheck.check( {
                endpoint: 'https://mcp.example.com/sse',
                timeout: 5000
            } )

            expect( categories[ 'isHttpReachable' ] ).toBe( true )
            expect( categories[ 'isHttps' ] ).toBe( true )
            expect( categories[ 'hasValidSsl' ] ).toBe( true )
            expect( categories[ 'hasSslCertificate' ] ).toBe( true )
            expect( categories[ 'isApiEndpoint' ] ).toBe( true )
            expect( categories[ 'isWebsite' ] ).toBe( false )
            expect( categories[ 'hasServerHeader' ] ).toBe( true )
            expect( categories[ 'supportsCors' ] ).toBe( true )
            expect( categories[ 'supportsHttp2' ] ).toBe( true )

            expect( entries[ 'protocol' ] ).toBe( 'https' )
            expect( entries[ 'statusCode' ] ).toBe( 200 )
            expect( entries[ 'ipAddress' ] ).toBe( '93.184.216.34' )
            expect( entries[ 'sslProtocol' ] ).toBe( 'TLSv1.3' )
            expect( entries[ 'sslIssuer' ] ).toBe( 'Test CA' )
            expect( entries[ 'contentType' ] ).toBe( 'application/json' )
            expect( entries[ 'serverHeader' ] ).toBe( 'nginx/1.24' )
            expect( entries[ 'redirectCount' ] ).toBe( 0 )
            expect( typeof entries[ 'responseTimeMs' ] ).toBe( 'number' )

            const httpCodes = messages
                .filter( ( m ) => m.startsWith( 'HTTP-' ) )
                .map( ( m ) => m.slice( 0, 8 ) )

            expect( httpCodes ).toContain( 'HTTP-010' )
            expect( httpCodes ).toContain( 'HTTP-011' )
            expect( httpCodes ).toContain( 'HTTP-012' )
            expect( httpCodes ).toContain( 'HTTP-013' )
        } )


        test( 'returns DNS failure when hostname cannot be resolved', async () => {
            mockResolve4.mockRejectedValue( new Error( 'ENOTFOUND' ) )

            const { messages, categories, entries } = await HttpPreCheck.check( {
                endpoint: 'https://nonexistent.invalid/mcp',
                timeout: 5000
            } )

            expect( categories[ 'isHttpReachable' ] ).toBe( false )
            expect( entries[ 'ipAddress' ] ).toBe( null )
            expect( messages[ 0 ] ).toMatch( /HTTP-001 dns:/ )
        } )


        test( 'skips DNS resolution for IPv4 addresses', async () => {
            mockTlsConnect.mockImplementation( ( _options, callback ) => {
                const socket = {
                    authorized: true,
                    authorizationError: null,
                    getPeerCertificate: () => ( {} ),
                    getProtocol: () => 'TLSv1.3',
                    alpnProtocol: null,
                    on: jest.fn(),
                    destroy: jest.fn()
                }

                process.nextTick( () => { callback() } )

                return socket
            } )

            globalThis.fetch = jest.fn().mockResolvedValue( {
                status: 200,
                headers: new Map( [
                    [ 'content-type', 'text/plain' ]
                ] )
            } )

            const { entries } = await HttpPreCheck.check( {
                endpoint: 'https://127.0.0.1:8443/mcp',
                timeout: 5000
            } )

            expect( mockResolve4 ).not.toHaveBeenCalled()
            expect( entries[ 'ipAddress' ] ).toBe( '127.0.0.1' )
        } )


        test( 'detects HTTP instead of HTTPS', async () => {
            mockResolve4.mockResolvedValue( [ '10.0.0.1' ] )

            globalThis.fetch = jest.fn().mockResolvedValue( {
                status: 200,
                headers: new Map( [
                    [ 'content-type', 'application/json' ]
                ] )
            } )

            const { messages, categories } = await HttpPreCheck.check( {
                endpoint: 'http://api.example.com/v1',
                timeout: 5000
            } )

            expect( categories[ 'isHttps' ] ).toBe( false )
            expect( categories[ 'hasValidSsl' ] ).toBe( false )
            expect( categories[ 'isHttpReachable' ] ).toBe( true )

            const hasHttpWarning = messages.some( ( m ) => m.startsWith( 'HTTP-004' ) )

            expect( hasHttpWarning ).toBe( true )
            expect( mockTlsConnect ).not.toHaveBeenCalled()
        } )


        test( 'detects expired SSL certificate', async () => {
            mockResolve4.mockResolvedValue( [ '10.0.0.1' ] )

            mockTlsConnect.mockImplementation( ( _options, callback ) => {
                const socket = {
                    authorized: false,
                    authorizationError: 'CERT_HAS_EXPIRED',
                    getPeerCertificate: () => ( { issuer: { O: 'Expired CA' }, valid_to: 'Jan 01 2020 00:00:00 GMT' } ),
                    getProtocol: () => 'TLSv1.2',
                    alpnProtocol: null,
                    on: jest.fn(),
                    destroy: jest.fn()
                }

                process.nextTick( () => { callback() } )

                return socket
            } )

            globalThis.fetch = jest.fn().mockResolvedValue( {
                status: 200,
                headers: new Map( [
                    [ 'content-type', 'text/plain' ]
                ] )
            } )

            const { messages, categories } = await HttpPreCheck.check( {
                endpoint: 'https://expired.example.com/mcp',
                timeout: 5000
            } )

            expect( categories[ 'hasValidSsl' ] ).toBe( false )
            expect( categories[ 'hasSslCertificate' ] ).toBe( true )

            const hasExpiredWarning = messages.some( ( m ) => m.startsWith( 'HTTP-005' ) )

            expect( hasExpiredWarning ).toBe( true )
        } )


        test( 'detects self-signed SSL certificate', async () => {
            mockResolve4.mockResolvedValue( [ '10.0.0.1' ] )

            mockTlsConnect.mockImplementation( ( _options, callback ) => {
                const socket = {
                    authorized: false,
                    authorizationError: 'DEPTH_ZERO_SELF_SIGNED_CERT',
                    getPeerCertificate: () => ( { issuer: { CN: 'localhost' }, valid_to: 'Jan 01 2030 00:00:00 GMT' } ),
                    getProtocol: () => 'TLSv1.3',
                    alpnProtocol: null,
                    on: jest.fn(),
                    destroy: jest.fn()
                }

                process.nextTick( () => { callback() } )

                return socket
            } )

            globalThis.fetch = jest.fn().mockResolvedValue( {
                status: 200,
                headers: new Map( [
                    [ 'content-type', 'text/plain' ]
                ] )
            } )

            const { messages, categories } = await HttpPreCheck.check( {
                endpoint: 'https://self-signed.example.com/mcp',
                timeout: 5000
            } )

            expect( categories[ 'hasValidSsl' ] ).toBe( false )
            expect( categories[ 'hasSslCertificate' ] ).toBe( true )

            const hasSelfSignedWarning = messages.some( ( m ) => m.startsWith( 'HTTP-006' ) )

            expect( hasSelfSignedWarning ).toBe( true )
        } )


        test( 'detects website (HTML response)', async () => {
            mockResolve4.mockResolvedValue( [ '10.0.0.1' ] )

            mockTlsConnect.mockImplementation( ( _options, callback ) => {
                const socket = {
                    authorized: true,
                    authorizationError: null,
                    getPeerCertificate: () => ( { issuer: { O: 'CA' }, valid_to: 'Jan 01 2027 00:00:00 GMT' } ),
                    getProtocol: () => 'TLSv1.3',
                    alpnProtocol: null,
                    on: jest.fn(),
                    destroy: jest.fn()
                }

                process.nextTick( () => { callback() } )

                return socket
            } )

            globalThis.fetch = jest.fn().mockResolvedValue( {
                status: 200,
                headers: new Map( [
                    [ 'content-type', 'text/html; charset=utf-8' ]
                ] )
            } )

            const { categories, messages } = await HttpPreCheck.check( {
                endpoint: 'https://example.com',
                timeout: 5000
            } )

            expect( categories[ 'isWebsite' ] ).toBe( true )
            expect( categories[ 'isApiEndpoint' ] ).toBe( false )

            const hasWebsiteInfo = messages.some( ( m ) => m.startsWith( 'HTTP-009' ) )

            expect( hasWebsiteInfo ).toBe( true )
        } )


        test( 'detects redirect chain', async () => {
            mockResolve4.mockResolvedValue( [ '10.0.0.1' ] )

            mockTlsConnect.mockImplementation( ( _options, callback ) => {
                const socket = {
                    authorized: true,
                    authorizationError: null,
                    getPeerCertificate: () => ( { issuer: { O: 'CA' }, valid_to: 'Jan 01 2027 00:00:00 GMT' } ),
                    getProtocol: () => 'TLSv1.3',
                    alpnProtocol: null,
                    on: jest.fn(),
                    destroy: jest.fn()
                }

                process.nextTick( () => { callback() } )

                return socket
            } )

            let callCount = 0

            globalThis.fetch = jest.fn().mockImplementation( () => {
                callCount++

                if( callCount === 1 ) {
                    return Promise.resolve( {
                        status: 301,
                        headers: new Map( [
                            [ 'location', 'https://example.com/new-path' ]
                        ] )
                    } )
                }

                if( callCount === 2 ) {
                    return Promise.resolve( {
                        status: 302,
                        headers: new Map( [
                            [ 'location', 'https://example.com/final' ]
                        ] )
                    } )
                }

                return Promise.resolve( {
                    status: 200,
                    headers: new Map( [
                        [ 'content-type', 'application/json' ]
                    ] )
                } )
            } )

            const { categories, entries, messages } = await HttpPreCheck.check( {
                endpoint: 'https://example.com/old-path',
                timeout: 5000
            } )

            expect( categories[ 'hasRedirects' ] ).toBe( true )
            expect( entries[ 'redirectCount' ] ).toBe( 2 )
            expect( entries[ 'redirectChain' ] ).toHaveLength( 2 )
            expect( entries[ 'redirectChain' ][ 0 ][ 'from' ] ).toBe( 'https://example.com/old-path' )
            expect( entries[ 'redirectChain' ][ 0 ][ 'to' ] ).toBe( 'https://example.com/new-path' )
            expect( entries[ 'redirectChain' ][ 0 ][ 'statusCode' ] ).toBe( 301 )
            expect( entries[ 'redirectChain' ][ 1 ][ 'statusCode' ] ).toBe( 302 )
            expect( entries[ 'statusCode' ] ).toBe( 200 )

            const hasRedirectInfo = messages.some( ( m ) => m.startsWith( 'HTTP-007' ) )

            expect( hasRedirectInfo ).toBe( true )
        } )


        test( 'handles connection timeout', async () => {
            mockResolve4.mockResolvedValue( [ '10.0.0.1' ] )

            mockTlsConnect.mockImplementation( ( _options, callback ) => {
                const socket = {
                    authorized: true,
                    authorizationError: null,
                    getPeerCertificate: () => ( { issuer: { O: 'CA' }, valid_to: 'Jan 01 2027 00:00:00 GMT' } ),
                    getProtocol: () => 'TLSv1.3',
                    alpnProtocol: null,
                    on: jest.fn(),
                    destroy: jest.fn()
                }

                process.nextTick( () => { callback() } )

                return socket
            } )

            const abortError = new Error( 'The operation was aborted' )
            abortError.name = 'AbortError'

            globalThis.fetch = jest.fn().mockRejectedValue( abortError )

            const { messages, categories } = await HttpPreCheck.check( {
                endpoint: 'https://slow.example.com/mcp',
                timeout: 5000
            } )

            expect( categories[ 'isHttpReachable' ] ).toBe( false )

            const hasTimeoutError = messages.some( ( m ) => m.startsWith( 'HTTP-003' ) )

            expect( hasTimeoutError ).toBe( true )
        } )


        test( 'handles connection refused', async () => {
            mockResolve4.mockResolvedValue( [ '10.0.0.1' ] )

            mockTlsConnect.mockImplementation( ( _options, callback ) => {
                const socket = {
                    authorized: true,
                    authorizationError: null,
                    getPeerCertificate: () => ( { issuer: { O: 'CA' }, valid_to: 'Jan 01 2027 00:00:00 GMT' } ),
                    getProtocol: () => 'TLSv1.3',
                    alpnProtocol: null,
                    on: jest.fn(),
                    destroy: jest.fn()
                }

                process.nextTick( () => { callback() } )

                return socket
            } )

            globalThis.fetch = jest.fn().mockRejectedValue( new Error( 'ECONNREFUSED' ) )

            const { messages, categories } = await HttpPreCheck.check( {
                endpoint: 'https://dead.example.com/mcp',
                timeout: 5000
            } )

            expect( categories[ 'isHttpReachable' ] ).toBe( false )

            const hasConnectionError = messages.some( ( m ) => m.startsWith( 'HTTP-002' ) )

            expect( hasConnectionError ).toBe( true )
        } )


        test( 'handles SSL check timeout gracefully', async () => {
            mockResolve4.mockResolvedValue( [ '10.0.0.1' ] )

            mockTlsConnect.mockImplementation( ( _options, _callback ) => {
                const handlers = {}

                const socket = {
                    on: jest.fn().mockImplementation( ( event, handler ) => {
                        handlers[ event ] = handler

                        process.nextTick( () => {
                            if( event === 'timeout' && handlers[ 'timeout' ] ) {
                                handlers[ 'timeout' ]()
                            }
                        } )

                        return socket
                    } ),
                    destroy: jest.fn()
                }

                return socket
            } )

            globalThis.fetch = jest.fn().mockResolvedValue( {
                status: 200,
                headers: new Map( [
                    [ 'content-type', 'application/json' ]
                ] )
            } )

            const { categories, entries } = await HttpPreCheck.check( {
                endpoint: 'https://slow-ssl.example.com/mcp',
                timeout: 5000
            } )

            expect( categories[ 'hasSslCertificate' ] ).toBe( false )
            expect( categories[ 'hasValidSsl' ] ).toBe( false )
            expect( entries[ 'sslProtocol' ] ).toBe( null )
            expect( categories[ 'isHttpReachable' ] ).toBe( true )
        } )


        test( 'returns correct entry structure', async () => {
            mockResolve4.mockResolvedValue( [ '10.0.0.1' ] )

            mockTlsConnect.mockImplementation( ( _options, callback ) => {
                const socket = {
                    authorized: true,
                    authorizationError: null,
                    getPeerCertificate: () => ( {} ),
                    getProtocol: () => 'TLSv1.3',
                    alpnProtocol: null,
                    on: jest.fn(),
                    destroy: jest.fn()
                }

                process.nextTick( () => { callback() } )

                return socket
            } )

            globalThis.fetch = jest.fn().mockResolvedValue( {
                status: 404,
                headers: new Map( [
                    [ 'content-type', 'text/plain' ]
                ] )
            } )

            const { entries } = await HttpPreCheck.check( {
                endpoint: 'https://api.example.com/not-found',
                timeout: 5000
            } )

            expect( entries ).toHaveProperty( 'protocol' )
            expect( entries ).toHaveProperty( 'statusCode' )
            expect( entries ).toHaveProperty( 'redirectCount' )
            expect( entries ).toHaveProperty( 'redirectChain' )
            expect( entries ).toHaveProperty( 'contentType' )
            expect( entries ).toHaveProperty( 'serverHeader' )
            expect( entries ).toHaveProperty( 'responseTimeMs' )
            expect( entries ).toHaveProperty( 'sslProtocol' )
            expect( entries ).toHaveProperty( 'sslIssuer' )
            expect( entries ).toHaveProperty( 'sslExpiresAt' )
            expect( entries ).toHaveProperty( 'ipAddress' )
            expect( entries[ 'statusCode' ] ).toBe( 404 )
        } )

    } )

} )
