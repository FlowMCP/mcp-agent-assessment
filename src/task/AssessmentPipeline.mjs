import { McpServerValidator } from 'x402-mcp-validator'
import { A2aAgentValidator } from 'a2a-agent-validator'
import { McpAppsValidator } from 'mcp-apps-validator'

import { AssessmentBuilder } from './AssessmentBuilder.mjs'
import { Erc8004Lookup } from './Erc8004Lookup.mjs'
import { SeverityClassifier } from './SeverityClassifier.mjs'


class AssessmentPipeline {


    static async run( { endpoint, timeout, erc8004 } ) {
        const origin = new URL( endpoint ).origin

        const { layer1Result, layer2Result, layer3Result, layer4Result, layer5Result } = await AssessmentPipeline.#executeLayers( {
            endpoint,
            origin,
            timeout,
            erc8004
        } )

        const layer1Messages = ( layer1Result && layer1Result[ 'messages' ] ) || []
        const layer2Messages = ( layer2Result && layer2Result[ 'messages' ] ) || []
        const layer3Messages = AssessmentPipeline.#extractLayer3Messages( { layer3Result } )
        const layer4Messages = ( layer4Result && layer4Result[ 'messages' ] ) || []
        const layer5Messages = ( layer5Result && layer5Result[ 'messages' ] ) || []

        const { classified } = SeverityClassifier.classifyAll( {
            layer1Messages,
            layer2Messages,
            layer3Messages,
            layer4Messages,
            layer5Messages
        } )

        const { status, categories, entries } = AssessmentBuilder.build( {
            endpoint,
            classifiedMessages: classified,
            layer1Result,
            layer2Result,
            layer3Result,
            layer4Result,
            layer5Result
        } )

        const layers = {
            mcp: layer1Result,
            a2a: layer2Result,
            erc8004: layer3Result,
            reputation: layer4Result,
            ui: layer5Result
        }

        return { status, messages: classified, categories, entries, layers }
    }


    static async #executeLayers( { endpoint, origin, timeout, erc8004 } ) {
        const promises = [
            AssessmentPipeline.#runLayer1( { endpoint, timeout } ),
            AssessmentPipeline.#runLayer2( { origin, timeout } ),
            AssessmentPipeline.#runLayer5( { endpoint, timeout } )
        ]

        const hasErc8004 = erc8004 !== undefined && erc8004 !== null

        if( hasErc8004 ) {
            promises.push(
                AssessmentPipeline.#runLayer3( { origin, timeout, rpcNodes: erc8004[ 'rpcNodes' ] } )
            )
        }

        const results = await Promise.allSettled( promises )

        const layer1Result = results[ 0 ].status === 'fulfilled' ? results[ 0 ].value : AssessmentPipeline.#failedLayerResult( { error: results[ 0 ].reason } )
        const layer2Result = results[ 1 ].status === 'fulfilled' ? results[ 1 ].value : AssessmentPipeline.#failedLayerResult( { error: results[ 1 ].reason } )
        const layer5Result = results[ 2 ].status === 'fulfilled' ? results[ 2 ].value : AssessmentPipeline.#failedLayerResult( { error: results[ 2 ].reason } )

        let layer3Result = null
        let layer4Result = null

        if( hasErc8004 ) {
            layer3Result = results[ 3 ].status === 'fulfilled' ? results[ 3 ].value : AssessmentPipeline.#failedLayer3Result( { error: results[ 3 ].reason } )

            const { rpcNode, agentId } = AssessmentPipeline.#extractLayer3Context( { layer3Result } )

            if( rpcNode && agentId ) {
                try {
                    layer4Result = await AssessmentPipeline.#runLayer4( { rpcNode, agentId, timeout } )
                } catch( error ) {
                    layer4Result = { result: null, messages: [ `RPC-010 reputation: ${error.message}` ] }
                }
            }
        }

        if( !hasErc8004 && layer2Result ) {
            const erc8004ServiceUrl = AssessmentPipeline.#extractErc8004ServiceUrl( { layer2Result } )

            if( erc8004ServiceUrl ) {
                try {
                    const derivedOrigin = new URL( erc8004ServiceUrl ).origin
                    layer3Result = await AssessmentPipeline.#runLayer3Derived( { origin: derivedOrigin, timeout } )
                } catch( _error ) {
                    // Invalid URL in erc8004ServiceUrl — skip silently
                }
            }
        }

        return { layer1Result, layer2Result, layer3Result, layer4Result, layer5Result }
    }


    static async #runLayer1( { endpoint, timeout } ) {
        const result = await McpServerValidator.start( { endpoint, timeout } )

        return result
    }


    static async #runLayer2( { origin, timeout } ) {
        const result = await A2aAgentValidator.start( { endpoint: origin, timeout } )

        return result
    }


    static async #runLayer3( { origin, timeout, rpcNodes } ) {
        const { found, registrations, messages } = await Erc8004Lookup.fetchRegistration( { origin, timeout } )

        if( !found || registrations.length === 0 ) {
            return { found, registrations: [], verification: null, messages }
        }

        const firstRegistration = registrations[ 0 ]
        const { result, messages: verifyMessages, rpcNode } = await Erc8004Lookup.verifyRegistration( {
            registration: firstRegistration,
            rpcNodes,
            timeout
        } )

        const allMessages = [ ...messages, ...verifyMessages ]

        return { found, registrations, verification: { result, rpcNode }, messages: allMessages }
    }


    static async #runLayer4( { rpcNode, agentId, timeout } ) {
        const { result, messages } = await Erc8004Lookup.queryReputation( { rpcNode, agentId, timeout } )

        return { result, messages }
    }


    static async #runLayer5( { endpoint, timeout } ) {
        const result = await McpAppsValidator.start( { endpoint, timeout } )

        return result
    }


    static #extractErc8004ServiceUrl( { layer2Result } ) {
        if( !layer2Result || !layer2Result[ 'entries' ] ) {
            return null
        }

        const erc8004ServiceUrl = layer2Result[ 'entries' ][ 'erc8004ServiceUrl' ] || null

        return erc8004ServiceUrl
    }


    static async #runLayer3Derived( { origin, timeout } ) {
        const { found, registrations, messages } = await Erc8004Lookup.fetchRegistration( { origin, timeout } )

        if( !found || registrations.length === 0 ) {
            return { found, registrations: [], verification: null, messages }
        }

        return { found, registrations, verification: null, messages }
    }


    static #extractLayer3Context( { layer3Result } ) {
        if( !layer3Result || !layer3Result[ 'verification' ] ) {
            return { rpcNode: null, agentId: null }
        }

        const { result, rpcNode } = layer3Result[ 'verification' ]

        if( !rpcNode || !result || result[ 'agentId' ] === null ) {
            return { rpcNode: null, agentId: null }
        }

        const agentId = result[ 'agentId' ]

        return { rpcNode, agentId }
    }


    static #extractLayer3Messages( { layer3Result } ) {
        if( !layer3Result ) {
            return []
        }

        const messages = layer3Result[ 'messages' ] || []

        return messages
    }


    static #failedLayerResult( { error } ) {
        const message = error && error.message ? error.message : 'Unknown error'
        const result = {
            status: false,
            messages: [ `CON-001 endpoint: ${message}` ],
            categories: {},
            entries: {}
        }

        return result
    }


    static #failedLayer3Result( { error } ) {
        const message = error && error.message ? error.message : 'Unknown error'
        const result = {
            found: false,
            registrations: [],
            verification: null,
            messages: [ `REG-001 well-known: ${message}` ]
        }

        return result
    }
}


export { AssessmentPipeline }
