import { Erc8004RegistryParser } from 'erc8004-registry-parser'


class Erc8004Lookup {


    static #IDENTITY_REGISTRY = '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432'
    static #REPUTATION_REGISTRY = '0x8004baa17c55a88189ae136b182e5fda19de9b63'


    static #CHAIN_ID_TO_ALIAS = {
        1: 'ETHEREUM_MAINNET',
        10: 'OPTIMISM_MAINNET',
        56: 'BNB_MAINNET',
        100: 'GNOSIS_MAINNET',
        137: 'POLYGON_MAINNET',
        143: 'MONAD_MAINNET',
        196: 'XLAYER_MAINNET',
        8453: 'BASE_MAINNET',
        42161: 'ARBITRUM_MAINNET',
        42220: 'CELO_MAINNET',
        43114: 'AVALANCHE_MAINNET',
        59144: 'LINEA_MAINNET',
        167000: 'TAIKO_MAINNET',
        534352: 'SCROLL_MAINNET',
        11155111: 'SEPOLIA_TESTNET',
        84532: 'BASE_SEPOLIA_TESTNET'
    }


    static #CAIP2_TO_ALIAS = {
        'eip155:1': 'ETHEREUM_MAINNET',
        'eip155:10': 'OPTIMISM_MAINNET',
        'eip155:56': 'BNB_MAINNET',
        'eip155:100': 'GNOSIS_MAINNET',
        'eip155:137': 'POLYGON_MAINNET',
        'eip155:143': 'MONAD_MAINNET',
        'eip155:196': 'XLAYER_MAINNET',
        'eip155:8453': 'BASE_MAINNET',
        'eip155:42161': 'ARBITRUM_MAINNET',
        'eip155:42220': 'CELO_MAINNET',
        'eip155:43114': 'AVALANCHE_MAINNET',
        'eip155:59144': 'LINEA_MAINNET',
        'eip155:167000': 'TAIKO_MAINNET',
        'eip155:534352': 'SCROLL_MAINNET',
        'eip155:11155111': 'SEPOLIA_TESTNET',
        'eip155:84532': 'BASE_SEPOLIA_TESTNET'
    }


    static #TOKEN_URI_SELECTOR = '0xc87b56dd'
    static #OWNER_OF_SELECTOR = '0x6352211e'
    static #GET_METADATA_SELECTOR = '0x75c1e5e0'


    static async fetchRegistration( { origin, timeout } ) {
        const messages = []
        const url = `${origin}/.well-known/agent-registration.json`
        let timeoutId = null

        try {
            const controller = new AbortController()
            timeoutId = setTimeout( () => { controller.abort() }, timeout )

            const response = await fetch( url, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            } )

            clearTimeout( timeoutId )

            if( !response.ok ) {
                messages.push( `REG-001 well-known: File not found (HTTP ${response.status})` )

                return { found: false, registrations: [], messages }
            }

            let body = null

            try {
                body = JSON.parse( await response.text() )
            } catch( _e ) {
                messages.push( 'REG-002 well-known: Response is not valid JSON' )

                return { found: false, registrations: [], messages }
            }

            if( !body[ 'registrations' ] || !Array.isArray( body[ 'registrations' ] ) ) {
                messages.push( 'REG-003 well-known: Missing or invalid "registrations" array' )

                return { found: false, registrations: [], messages }
            }

            return { found: true, registrations: body[ 'registrations' ], messages }
        } catch( error ) {
            clearTimeout( timeoutId )
            const isAbort = error.name === 'AbortError'
            const detail = isAbort ? 'Request timed out' : error.message

            messages.push( `REG-001 well-known: ${detail}` )

            return { found: false, registrations: [], messages }
        }
    }


    static async verifyRegistration( { registration, rpcNodes, timeout } ) {
        const messages = []
        const result = {
            agentId: null,
            agentRegistry: null,
            chainId: null,
            chainAlias: null,
            registrationName: null,
            registrationDescription: null,
            isOnChainVerified: false,
            isSpecCompliant: false,
            x402Support: null,
            isActive: null,
            services: null,
            supportedTrust: null
        }

        const { agentId, agentRegistry, chainId: rawChainId, name, description } = registration

        if( agentId === undefined || agentId === null ) {
            messages.push( 'REG-020 agentId: Missing required field' )
        }

        if( agentRegistry === undefined || agentRegistry === null ) {
            messages.push( 'REG-021 agentRegistry: Missing required field' )
        }

        if( rawChainId === undefined || rawChainId === null ) {
            messages.push( 'REG-022 chainId: Missing required field' )
        }

        if( messages.length > 0 ) {
            return { result, messages, rpcNode: null }
        }

        result[ 'agentId' ] = agentId
        result[ 'agentRegistry' ] = agentRegistry
        result[ 'registrationName' ] = name || null
        result[ 'registrationDescription' ] = description || null

        const { alias } = Erc8004Lookup.#resolveChainAlias( { rawChainId } )

        if( alias === null ) {
            messages.push( `REG-022 chainId: Unknown chain identifier "${rawChainId}"` )

            return { result, messages, rpcNode: null }
        }

        result[ 'chainId' ] = typeof rawChainId === 'number' ? rawChainId : null
        result[ 'chainAlias' ] = alias

        const rpcNode = rpcNodes[ alias ]

        if( !rpcNode ) {
            messages.push( `RPC-001 rpcNodes.${alias}: No RPC node configured for chain` )

            return { result, messages, rpcNode: null }
        }

        try {
            const { agentUri, owner } = await Erc8004Lookup.#queryOnChainAgent( {
                rpcNode,
                proxyAddress: Erc8004Lookup.#IDENTITY_REGISTRY,
                agentId,
                timeout
            } )

            if( agentUri === null ) {
                messages.push( 'RPC-003 registry: Agent not found in on-chain registry' )

                return { result, messages, rpcNode }
            }

            result[ 'isOnChainVerified' ] = true

            const parseResult = Erc8004RegistryParser.validateFromUri( {
                agentUri,
                agentId: String( agentId ),
                ownerAddress: owner
            } )

            const { categories: parsedCategories, entries: parsedEntries } = parseResult

            if( parsedCategories ) {
                result[ 'isSpecCompliant' ] = parsedCategories[ 'isSpecCompliant' ] || false
                result[ 'x402Support' ] = parsedCategories[ 'hasX402Support' ] || null
                result[ 'isActive' ] = parsedCategories[ 'isActive' ] || null
            }

            if( parsedEntries ) {
                result[ 'services' ] = parsedEntries[ 'services' ] || null
                result[ 'supportedTrust' ] = parsedEntries[ 'supportedTrust' ] || null
            }

            if( parseResult[ 'messages' ] && parseResult[ 'messages' ].length > 0 ) {
                parseResult[ 'messages' ]
                    .forEach( ( msg ) => {
                        messages.push( `REG-030 spec: ${msg}` )
                    } )
            }
        } catch( error ) {
            messages.push( `RPC-002 eth_call: ${error.message}` )

            return { result, messages, rpcNode }
        }

        return { result, messages, rpcNode }
    }


    static async queryReputation( { rpcNode, agentId, timeout } ) {
        const messages = []
        const result = {
            feedbackCount: null,
            averageValue: null,
            valueDecimals: null,
            validationCount: null,
            averageResponse: null
        }

        try {
            const { metadataBytes } = await Erc8004Lookup.#queryMetadata( {
                rpcNode,
                proxyAddress: Erc8004Lookup.#REPUTATION_REGISTRY,
                agentId,
                metadataKey: 'reputation',
                timeout
            } )

            if( metadataBytes === null || metadataBytes === '0x' || metadataBytes.length <= 2 ) {
                messages.push( 'REP-001: No reputation data found' )

                return { result, messages }
            }

            const { decoded } = Erc8004Lookup.#decodeReputationData( { metadataBytes } )

            if( decoded !== null ) {
                result[ 'feedbackCount' ] = decoded[ 'feedbackCount' ]
                result[ 'averageValue' ] = decoded[ 'averageValue' ]
                result[ 'valueDecimals' ] = decoded[ 'valueDecimals' ]
                result[ 'validationCount' ] = decoded[ 'validationCount' ]
                result[ 'averageResponse' ] = decoded[ 'averageResponse' ]
            } else {
                messages.push( 'REP-001: No reputation data found' )
            }
        } catch( error ) {
            messages.push( `RPC-010 reputation: ${error.message}` )
        }

        return { result, messages }
    }


    static #resolveChainAlias( { rawChainId } ) {
        if( typeof rawChainId === 'number' ) {
            const alias = Erc8004Lookup.#CHAIN_ID_TO_ALIAS[ rawChainId ] || null

            return { alias }
        }

        if( typeof rawChainId === 'string' ) {
            const caipAlias = Erc8004Lookup.#CAIP2_TO_ALIAS[ rawChainId ] || null

            if( caipAlias ) {
                return { alias: caipAlias }
            }

            const parsed = parseInt( rawChainId, 10 )

            if( !isNaN( parsed ) ) {
                const alias = Erc8004Lookup.#CHAIN_ID_TO_ALIAS[ parsed ] || null

                return { alias }
            }
        }

        return { alias: null }
    }


    static async #queryOnChainAgent( { rpcNode, proxyAddress, agentId, timeout } ) {
        const paddedId = BigInt( agentId ).toString( 16 ).padStart( 64, '0' )

        const tokenUriData = `${Erc8004Lookup.#TOKEN_URI_SELECTOR}${paddedId}`
        const ownerOfData = `${Erc8004Lookup.#OWNER_OF_SELECTOR}${paddedId}`

        const [ uriResponse, ownerResponse ] = await Promise.allSettled( [
            Erc8004Lookup.#ethCall( { rpcNode, to: proxyAddress, data: tokenUriData, timeout } ),
            Erc8004Lookup.#ethCall( { rpcNode, to: proxyAddress, data: ownerOfData, timeout } )
        ] )

        let agentUri = null
        let owner = null

        if( uriResponse.status === 'fulfilled' && uriResponse.value[ 'result' ] ) {
            const { decoded } = Erc8004Lookup.#decodeStringResult( { hex: uriResponse.value[ 'result' ] } )

            agentUri = decoded
        }

        if( ownerResponse.status === 'fulfilled' && ownerResponse.value[ 'result' ] ) {
            const rawOwner = ownerResponse.value[ 'result' ]

            if( rawOwner.length >= 42 ) {
                owner = `0x${rawOwner.slice( -40 )}`
            }
        }

        return { agentUri, owner }
    }


    static async #queryMetadata( { rpcNode, proxyAddress, agentId, metadataKey, timeout } ) {
        const paddedId = BigInt( agentId ).toString( 16 ).padStart( 64, '0' )

        const keyHex = Buffer.from( metadataKey, 'utf8' ).toString( 'hex' )
        const keyOffset = '0000000000000000000000000000000000000000000000000000000000000040'
        const keyLength = ( metadataKey.length ).toString( 16 ).padStart( 64, '0' )
        const keyPadded = keyHex.padEnd( 64, '0' )

        const data = `${Erc8004Lookup.#GET_METADATA_SELECTOR}${paddedId}${keyOffset}${keyLength}${keyPadded}`

        const { result } = await Erc8004Lookup.#ethCall( { rpcNode, to: proxyAddress, data, timeout } )

        return { metadataBytes: result }
    }


    static async #ethCall( { rpcNode, to, data, timeout } ) {
        const controller = new AbortController()
        const timeoutId = setTimeout( () => { controller.abort() }, timeout )

        let response = null

        try {
            response = await fetch( rpcNode, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify( {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_call',
                    params: [ { to, data }, 'latest' ]
                } )
            } )
        } catch( error ) {
            clearTimeout( timeoutId )

            throw error
        }

        clearTimeout( timeoutId )

        if( !response.ok ) {
            throw new Error( `RPC returned HTTP ${response.status}` )
        }

        const json = await response.json()

        if( json[ 'error' ] ) {
            throw new Error( `RPC error: ${json[ 'error' ][ 'message' ]}` )
        }

        const result = json[ 'result' ] || null

        return { result }
    }


    static #decodeStringResult( { hex } ) {
        if( !hex || hex === '0x' || hex.length < 130 ) {
            return { decoded: null }
        }

        try {
            const clean = hex.startsWith( '0x' ) ? hex.slice( 2 ) : hex
            const offset = parseInt( clean.slice( 0, 64 ), 16 ) * 2
            const length = parseInt( clean.slice( offset, offset + 64 ), 16 )
            const strHex = clean.slice( offset + 64, offset + 64 + length * 2 )

            const decoded = Buffer.from( strHex, 'hex' ).toString( 'utf8' )

            return { decoded }
        } catch( _e ) {
            return { decoded: null }
        }
    }


    static #decodeReputationData( { metadataBytes } ) {
        try {
            const clean = metadataBytes.startsWith( '0x' ) ? metadataBytes.slice( 2 ) : metadataBytes

            if( clean.length < 128 ) {
                return { decoded: null }
            }

            const offset = parseInt( clean.slice( 0, 64 ), 16 ) * 2
            const length = parseInt( clean.slice( offset, offset + 64 ), 16 )
            const dataHex = clean.slice( offset + 64, offset + 64 + length * 2 )

            const jsonStr = Buffer.from( dataHex, 'hex' ).toString( 'utf8' )
            const decoded = JSON.parse( jsonStr )

            return { decoded }
        } catch( _e ) {
            return { decoded: null }
        }
    }
}


export { Erc8004Lookup }
