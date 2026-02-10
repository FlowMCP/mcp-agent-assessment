class AssessmentBuilder {


    static build( { endpoint, classifiedMessages, layer1Result, layer2Result, layer3Result, layer4Result, layer5Result } ) {
        const { categories } = AssessmentBuilder.#buildCategories( {
            layer1Result,
            layer2Result,
            layer3Result,
            layer4Result,
            layer5Result,
            classifiedMessages
        } )

        const { entries } = AssessmentBuilder.#buildEntries( {
            endpoint,
            layer1Result,
            layer2Result,
            layer3Result,
            layer4Result,
            layer5Result,
            classifiedMessages
        } )

        const status = !classifiedMessages.some( ( msg ) => {
            const isError = msg[ 'severity' ] === 'ERROR'

            return isError
        } )

        return { status, categories, entries }
    }


    static #buildCategories( { layer1Result, layer2Result, layer3Result, layer4Result, layer5Result, classifiedMessages } ) {
        const layer1Categories = ( layer1Result && layer1Result[ 'categories' ] ) || {}
        const layer2Categories = ( layer2Result && layer2Result[ 'categories' ] ) || {}
        const layer5Categories = ( layer5Result && layer5Result[ 'categories' ] ) || {}

        const categories = {
            isReachable: layer1Categories[ 'isReachable' ] || false,
            supportsMcp: layer1Categories[ 'supportsMcp' ] || false,
            hasTools: layer1Categories[ 'hasTools' ] || false,
            hasResources: layer1Categories[ 'hasResources' ] || false,
            hasPrompts: layer1Categories[ 'hasPrompts' ] || false,
            supportsX402: layer1Categories[ 'supportsX402' ] || false,
            hasValidPaymentRequirements: layer1Categories[ 'hasValidPaymentRequirements' ] || false,
            supportsExactScheme: layer1Categories[ 'supportsExactScheme' ] || false,
            supportsEvm: layer1Categories[ 'supportsEvm' ] || false,
            supportsSolana: layer1Categories[ 'supportsSolana' ] || false,
            supportsTasks: layer1Categories[ 'supportsTasks' ] || false,
            supportsMcpApps: layer1Categories[ 'supportsMcpApps' ] || false,
            supportsLogging: layer1Categories[ 'supportsLogging' ] || false,
            supportsCompletions: layer1Categories[ 'supportsCompletions' ] || false,
            supportsResourceSubscription: layer1Categories[ 'supportsResourceSubscription' ] || false,
            supportsResourceListChanged: layer1Categories[ 'supportsResourceListChanged' ] || false,
            supportsPromptListChanged: layer1Categories[ 'supportsPromptListChanged' ] || false,
            supportsToolListChanged: layer1Categories[ 'supportsToolListChanged' ] || false,
            supportsTaskList: layer1Categories[ 'supportsTaskList' ] || false,
            supportsTaskCancel: layer1Categories[ 'supportsTaskCancel' ] || false,
            supportsTaskAugmentedToolCall: layer1Categories[ 'supportsTaskAugmentedToolCall' ] || false,
            hasExperimentalCapabilities: layer1Categories[ 'hasExperimentalCapabilities' ] || false,
            specVersion: layer1Categories[ 'specVersion' ] || null,

            supportsOAuth: layer1Categories[ 'supportsOAuth' ] || false,
            hasProtectedResourceMetadata: layer1Categories[ 'hasProtectedResourceMetadata' ] || false,
            hasAuthServerMetadata: layer1Categories[ 'hasAuthServerMetadata' ] || false,
            supportsPkce: layer1Categories[ 'supportsPkce' ] || false,
            hasDynamicRegistration: layer1Categories[ 'hasDynamicRegistration' ] || false,
            hasValidOAuthConfig: layer1Categories[ 'hasValidOAuthConfig' ] || false,

            hasA2aCard: layer2Categories[ 'isReachable' ] || false,
            hasA2aValidStructure: layer2Categories[ 'hasValidStructure' ] || false,
            hasA2aSkills: layer2Categories[ 'hasSkills' ] || false,
            supportsA2aStreaming: layer2Categories[ 'supportsStreaming' ] || false,
            hasA2aSecuritySchemes: layer2Categories[ 'hasSecuritySchemes' ] || false,
            hasA2aProvider: layer2Categories[ 'hasProvider' ] || false,
            supportsA2aPushNotifications: layer2Categories[ 'supportsPushNotifications' ] || false,
            supportsA2aJsonRpc: layer2Categories[ 'supportsJsonRpc' ] || false,
            supportsA2aGrpc: layer2Categories[ 'supportsGrpc' ] || false,
            supportsA2aExtendedCard: layer2Categories[ 'supportsExtendedCard' ] || false,
            hasA2aDocumentation: layer2Categories[ 'hasDocumentation' ] || false,
            supportsA2aAp2: layer2Categories[ 'supportsAp2' ] || false,
            hasA2aErc8004ServiceLink: layer2Categories[ 'hasErc8004ServiceLink' ] || false,

            uiSupportsMcpApps: layer5Categories[ 'supportsMcpApps' ] || false,
            uiHasUiResources: layer5Categories[ 'hasUiResources' ] || false,
            uiHasToolLinkage: layer5Categories[ 'hasUiToolLinkage' ] || false,
            uiHasValidHtml: layer5Categories[ 'hasValidUiHtml' ] || false,
            uiHasValidCsp: layer5Categories[ 'hasValidCsp' ] || false,
            uiSupportsTheming: layer5Categories[ 'supportsTheming' ] || false,

            hasWellKnownRegistration: false,
            hasErc8004Registration: false,
            isErc8004OnChainVerified: false,
            isErc8004SpecCompliant: false,

            hasOnChainReputation: false,

            overallHealthy: false
        }

        if( layer3Result ) {
            categories[ 'hasWellKnownRegistration' ] = layer3Result[ 'found' ] || false

            if( layer3Result[ 'verification' ] ) {
                const { result: verResult } = layer3Result[ 'verification' ]

                if( verResult ) {
                    categories[ 'hasErc8004Registration' ] = (
                        verResult[ 'agentId' ] !== null &&
                        verResult[ 'agentRegistry' ] !== null
                    )
                    categories[ 'isErc8004OnChainVerified' ] = verResult[ 'isOnChainVerified' ] || false
                    categories[ 'isErc8004SpecCompliant' ] = verResult[ 'isSpecCompliant' ] || false
                }
            }
        }

        if( layer4Result && layer4Result[ 'result' ] ) {
            const { feedbackCount, validationCount } = layer4Result[ 'result' ]
            const hasFeedback = feedbackCount !== null && feedbackCount > 0
            const hasValidation = validationCount !== null && validationCount > 0

            categories[ 'hasOnChainReputation' ] = hasFeedback || hasValidation
        }

        const hasErrors = classifiedMessages.some( ( msg ) => {
            const isError = msg[ 'severity' ] === 'ERROR'

            return isError
        } )

        categories[ 'overallHealthy' ] = !hasErrors

        return { categories }
    }


    static #buildEntries( { endpoint, layer1Result, layer2Result, layer3Result, layer4Result, layer5Result, classifiedMessages } ) {
        const layer1Entries = ( layer1Result && layer1Result[ 'entries' ] ) || {}
        const layer2Entries = ( layer2Result && layer2Result[ 'entries' ] ) || {}

        const { errorCount, warningCount, infoCount } = AssessmentBuilder.#countSeverities( { classifiedMessages } )
        const { grade } = AssessmentBuilder.#computeGrade( { errorCount, warningCount } )

        const entries = {
            endpoint,
            timestamp: new Date().toISOString(),

            mcp: {
                serverName: layer1Entries[ 'serverName' ] || null,
                serverVersion: layer1Entries[ 'serverVersion' ] || null,
                serverDescription: layer1Entries[ 'serverDescription' ] || null,
                protocolVersion: layer1Entries[ 'protocolVersion' ] || null,
                capabilities: layer1Entries[ 'capabilities' ] || null,
                instructions: layer1Entries[ 'instructions' ] || null,
                toolCount: Array.isArray( layer1Entries[ 'tools' ] ) ? layer1Entries[ 'tools' ].length : null,
                resourceCount: Array.isArray( layer1Entries[ 'resources' ] ) ? layer1Entries[ 'resources' ].length : null,
                promptCount: Array.isArray( layer1Entries[ 'prompts' ] ) ? layer1Entries[ 'prompts' ].length : null,
                tools: layer1Entries[ 'tools' ] || null,
                resources: layer1Entries[ 'resources' ] || null,
                prompts: layer1Entries[ 'prompts' ] || null,
                x402: layer1Entries[ 'x402' ] || null,
                oauth: layer1Entries[ 'oauth' ] || null,
                latency: layer1Entries[ 'latency' ] || null,
                specVersion: layer1Entries[ 'specVersion' ] || null,
                experimentalCapabilities: layer1Entries[ 'experimentalCapabilities' ] || null,
                taskCapabilities: layer1Entries[ 'taskCapabilities' ] || null
            },

            a2a: AssessmentBuilder.#buildA2aEntries( { layer2Entries } ),

            ui: AssessmentBuilder.#buildUiEntries( { layer5Result } ),

            erc8004: AssessmentBuilder.#buildErc8004Entries( { layer3Result } ),

            reputation: AssessmentBuilder.#buildReputationEntries( { layer4Result } ),

            assessment: {
                errorCount,
                warningCount,
                infoCount,
                grade
            }
        }

        return { entries }
    }


    static #buildA2aEntries( { layer2Entries } ) {
        if( !layer2Entries || !layer2Entries[ 'agentName' ] ) {
            return null
        }

        const a2a = {
            agentName: layer2Entries[ 'agentName' ] || null,
            agentDescription: layer2Entries[ 'agentDescription' ] || null,
            agentVersion: layer2Entries[ 'agentVersion' ] || null,
            skillCount: layer2Entries[ 'skillCount' ] || null,
            skills: layer2Entries[ 'skills' ] || null,
            protocolBindings: layer2Entries[ 'protocolBindings' ] || null,
            protocolVersion: layer2Entries[ 'protocolVersion' ] || null,
            provider: {
                organization: layer2Entries[ 'providerOrganization' ] || null,
                url: layer2Entries[ 'providerUrl' ] || null
            },
            ap2Version: layer2Entries[ 'ap2Version' ] || null,
            erc8004ServiceUrl: layer2Entries[ 'erc8004ServiceUrl' ] || null,
            extensions: layer2Entries[ 'extensions' ] || null
        }

        return a2a
    }


    static #buildUiEntries( { layer5Result } ) {
        if( !layer5Result || !layer5Result[ 'entries' ] ) {
            return null
        }

        const layer5Entries = layer5Result[ 'entries' ]

        if( !layer5Entries[ 'extensionVersion' ] && ( layer5Entries[ 'uiResourceCount' ] || 0 ) === 0 ) {
            return null
        }

        const ui = {
            extensionVersion: layer5Entries[ 'extensionVersion' ] || null,
            uiResourceCount: layer5Entries[ 'uiResourceCount' ] || 0,
            uiResources: layer5Entries[ 'uiResources' ] || [],
            uiLinkedToolCount: layer5Entries[ 'uiLinkedToolCount' ] || 0,
            uiLinkedTools: layer5Entries[ 'uiLinkedTools' ] || [],
            appOnlyToolCount: layer5Entries[ 'appOnlyToolCount' ] || 0,
            displayModes: layer5Entries[ 'displayModes' ] || [],
            cspSummary: layer5Entries[ 'cspSummary' ] || null,
            permissionsSummary: layer5Entries[ 'permissionsSummary' ] || [],
            latency: layer5Entries[ 'latency' ] || null
        }

        return ui
    }


    static #buildErc8004Entries( { layer3Result } ) {
        if( !layer3Result || !layer3Result[ 'verification' ] ) {
            return null
        }

        const { result: verResult } = layer3Result[ 'verification' ]

        if( !verResult || verResult[ 'agentId' ] === null ) {
            return null
        }

        const erc8004 = {
            agentId: verResult[ 'agentId' ],
            agentRegistry: verResult[ 'agentRegistry' ],
            chainId: verResult[ 'chainId' ],
            chainAlias: verResult[ 'chainAlias' ],
            registrationName: verResult[ 'registrationName' ],
            registrationDescription: verResult[ 'registrationDescription' ],
            isOnChainVerified: verResult[ 'isOnChainVerified' ],
            isSpecCompliant: verResult[ 'isSpecCompliant' ],
            x402Support: verResult[ 'x402Support' ],
            isActive: verResult[ 'isActive' ],
            services: verResult[ 'services' ],
            supportedTrust: verResult[ 'supportedTrust' ]
        }

        return erc8004
    }


    static #buildReputationEntries( { layer4Result } ) {
        if( !layer4Result || !layer4Result[ 'result' ] ) {
            return null
        }

        const { feedbackCount, averageValue, valueDecimals, validationCount, averageResponse } = layer4Result[ 'result' ]

        if( feedbackCount === null && validationCount === null ) {
            return null
        }

        const reputation = {
            feedbackCount,
            averageValue,
            valueDecimals,
            validationCount,
            averageResponse
        }

        return reputation
    }


    static #countSeverities( { classifiedMessages } ) {
        let errorCount = 0
        let warningCount = 0
        let infoCount = 0

        classifiedMessages
            .forEach( ( msg ) => {
                if( msg[ 'severity' ] === 'ERROR' ) { errorCount++ }
                else if( msg[ 'severity' ] === 'WARNING' ) { warningCount++ }
                else if( msg[ 'severity' ] === 'INFO' ) { infoCount++ }
            } )

        return { errorCount, warningCount, infoCount }
    }


    static #computeGrade( { errorCount, warningCount } ) {
        if( errorCount > 0 ) {
            const grade = 'C'

            return { grade }
        }

        if( warningCount > 0 ) {
            const grade = 'B'

            return { grade }
        }

        const grade = 'A'

        return { grade }
    }
}


export { AssessmentBuilder }
