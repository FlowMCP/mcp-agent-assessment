import { describe, test, expect, jest, afterEach } from '@jest/globals'

import { Erc8004Lookup } from '../../src/task/Erc8004Lookup.mjs'

import { TEST_ORIGIN, TEST_TIMEOUT, TEST_RPC_NODES } from '../helpers/config.mjs'


const originalFetch = global.fetch


describe( 'Erc8004Lookup', () => {

    afterEach( () => {
        global.fetch = originalFetch
    } )


    describe( 'fetchRegistration', () => {

        test( 'returns REG-001 when server returns 404', async () => {
            global.fetch = jest.fn( () => {
                const result = Promise.resolve( { ok: false, status: 404 } )

                return result
            } )

            const { found, registrations, messages } = await Erc8004Lookup.fetchRegistration( {
                origin: TEST_ORIGIN,
                timeout: TEST_TIMEOUT
            } )

            expect( found ).toBe( false )
            expect( registrations ).toHaveLength( 0 )
            expect( messages[ 0 ] ).toMatch( /REG-001/ )
        } )


        test( 'returns REG-002 when response is not valid JSON', async () => {
            global.fetch = jest.fn( () => {
                const result = Promise.resolve( {
                    ok: true,
                    text: () => {
                        const textResult = Promise.resolve( 'not-json' )

                        return textResult
                    }
                } )

                return result
            } )

            const { found, messages } = await Erc8004Lookup.fetchRegistration( {
                origin: TEST_ORIGIN,
                timeout: TEST_TIMEOUT
            } )

            expect( found ).toBe( false )
            expect( messages[ 0 ] ).toMatch( /REG-002/ )
        } )


        test( 'returns REG-003 when registrations array missing', async () => {
            global.fetch = jest.fn( () => {
                const result = Promise.resolve( {
                    ok: true,
                    text: () => {
                        const textResult = Promise.resolve( JSON.stringify( { something: 'else' } ) )

                        return textResult
                    }
                } )

                return result
            } )

            const { found, messages } = await Erc8004Lookup.fetchRegistration( {
                origin: TEST_ORIGIN,
                timeout: TEST_TIMEOUT
            } )

            expect( found ).toBe( false )
            expect( messages[ 0 ] ).toMatch( /REG-003/ )
        } )


        test( 'returns registrations when valid response', async () => {
            const mockRegistrations = [
                { agentId: '42', agentRegistry: '0x8004...', chainId: 8453 }
            ]

            global.fetch = jest.fn( () => {
                const result = Promise.resolve( {
                    ok: true,
                    text: () => {
                        const textResult = Promise.resolve( JSON.stringify( { registrations: mockRegistrations } ) )

                        return textResult
                    }
                } )

                return result
            } )

            const { found, registrations, messages } = await Erc8004Lookup.fetchRegistration( {
                origin: TEST_ORIGIN,
                timeout: TEST_TIMEOUT
            } )

            expect( found ).toBe( true )
            expect( registrations ).toHaveLength( 1 )
            expect( registrations[ 0 ][ 'agentId' ] ).toBe( '42' )
            expect( messages ).toHaveLength( 0 )
        } )


        test( 'returns REG-001 on network error', async () => {
            global.fetch = jest.fn( () => {
                const result = Promise.reject( new Error( 'Network error' ) )

                return result
            } )

            const { found, messages } = await Erc8004Lookup.fetchRegistration( {
                origin: TEST_ORIGIN,
                timeout: TEST_TIMEOUT
            } )

            expect( found ).toBe( false )
            expect( messages[ 0 ] ).toMatch( /REG-001/ )
            expect( messages[ 0 ] ).toMatch( /Network error/ )
        } )

    } )


    describe( 'verifyRegistration', () => {

        test( 'returns REG-020 when agentId missing', async () => {
            const registration = { agentRegistry: '0x8004...', chainId: 8453 }

            const { result, messages } = await Erc8004Lookup.verifyRegistration( {
                registration,
                rpcNodes: TEST_RPC_NODES,
                timeout: TEST_TIMEOUT
            } )

            expect( result[ 'agentId' ] ).toBe( null )
            expect( messages[ 0 ] ).toMatch( /REG-020/ )
        } )


        test( 'returns REG-021 when agentRegistry missing', async () => {
            const registration = { agentId: '42', chainId: 8453 }

            const { result, messages } = await Erc8004Lookup.verifyRegistration( {
                registration,
                rpcNodes: TEST_RPC_NODES,
                timeout: TEST_TIMEOUT
            } )

            expect( messages[ 0 ] ).toMatch( /REG-021/ )
        } )


        test( 'returns REG-022 when chainId missing', async () => {
            const registration = { agentId: '42', agentRegistry: '0x8004...' }

            const { result, messages } = await Erc8004Lookup.verifyRegistration( {
                registration,
                rpcNodes: TEST_RPC_NODES,
                timeout: TEST_TIMEOUT
            } )

            expect( messages[ 0 ] ).toMatch( /REG-022/ )
        } )


        test( 'returns REG-022 for unknown chainId', async () => {
            const registration = { agentId: '42', agentRegistry: '0x8004...', chainId: 999999 }

            const { result, messages } = await Erc8004Lookup.verifyRegistration( {
                registration,
                rpcNodes: TEST_RPC_NODES,
                timeout: TEST_TIMEOUT
            } )

            expect( messages[ 0 ] ).toMatch( /REG-022/ )
            expect( messages[ 0 ] ).toMatch( /Unknown chain/ )
        } )


        test( 'returns RPC-001 when no RPC node configured for chain', async () => {
            const registration = { agentId: '42', agentRegistry: '0x8004...', chainId: 11155111 }
            const rpcNodes = { 'ETHEREUM_MAINNET': 'https://eth.test/v2/key' }

            const { messages } = await Erc8004Lookup.verifyRegistration( {
                registration,
                rpcNodes,
                timeout: TEST_TIMEOUT
            } )

            expect( messages[ 0 ] ).toMatch( /RPC-001/ )
            expect( messages[ 0 ] ).toMatch( /SEPOLIA_TESTNET/ )
        } )


        test( 'resolves CAIP-2 chain identifiers', async () => {
            const registration = { agentId: '42', agentRegistry: '0x8004...', chainId: 'eip155:8453' }

            global.fetch = jest.fn( () => {
                const result = Promise.resolve( {
                    ok: true,
                    json: () => {
                        const jsonResult = Promise.resolve( {
                            jsonrpc: '2.0',
                            id: 1,
                            result: '0x'
                        } )

                        return jsonResult
                    }
                } )

                return result
            } )

            const { result, messages } = await Erc8004Lookup.verifyRegistration( {
                registration,
                rpcNodes: TEST_RPC_NODES,
                timeout: TEST_TIMEOUT
            } )

            expect( result[ 'chainAlias' ] ).toBe( 'BASE_MAINNET' )
        } )

    } )


    describe( 'queryReputation', () => {

        test( 'returns REP-001 when no reputation data', async () => {
            global.fetch = jest.fn( () => {
                const result = Promise.resolve( {
                    ok: true,
                    json: () => {
                        const jsonResult = Promise.resolve( {
                            jsonrpc: '2.0',
                            id: 1,
                            result: '0x'
                        } )

                        return jsonResult
                    }
                } )

                return result
            } )

            const { result, messages } = await Erc8004Lookup.queryReputation( {
                rpcNode: 'https://eth.test/v2/key',
                agentId: '42',
                timeout: TEST_TIMEOUT
            } )

            expect( result[ 'feedbackCount' ] ).toBe( null )
            expect( messages[ 0 ] ).toMatch( /REP-001/ )
        } )


        test( 'returns RPC-010 on network error', async () => {
            global.fetch = jest.fn( () => {
                const result = Promise.reject( new Error( 'Connection refused' ) )

                return result
            } )

            const { messages } = await Erc8004Lookup.queryReputation( {
                rpcNode: 'https://eth.test/v2/key',
                agentId: '42',
                timeout: TEST_TIMEOUT
            } )

            expect( messages[ 0 ] ).toMatch( /RPC-010/ )
        } )

    } )

} )
