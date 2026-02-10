import { AssessmentBuilder } from '../../src/task/AssessmentBuilder.mjs'

import { TEST_ENDPOINT } from '../helpers/config.mjs'


describe( 'AssessmentBuilder', () => {

    describe( 'build', () => {

        test( 'builds assessment with all layers populated', () => {
            const layer1Result = {
                status: true,
                messages: [],
                categories: {
                    isReachable: true,
                    supportsMcp: true,
                    hasTools: true,
                    hasResources: false,
                    hasPrompts: false,
                    supportsX402: true,
                    hasValidPaymentRequirements: true,
                    supportsExactScheme: true,
                    supportsEvm: true,
                    supportsSolana: false,
                    supportsTasks: false,
                    supportsMcpApps: false,
                    supportsLogging: false,
                    supportsCompletions: false,
                    supportsResourceSubscription: false,
                    supportsResourceListChanged: false,
                    supportsPromptListChanged: false,
                    supportsToolListChanged: false,
                    supportsTaskList: false,
                    supportsTaskCancel: false,
                    supportsTaskAugmentedToolCall: false,
                    hasExperimentalCapabilities: false,
                    specVersion: null,
                    supportsOAuth: false,
                    hasProtectedResourceMetadata: false,
                    hasAuthServerMetadata: false,
                    supportsPkce: false,
                    hasDynamicRegistration: false,
                    hasValidOAuthConfig: false
                },
                entries: {
                    endpoint: TEST_ENDPOINT,
                    serverName: 'TestServer',
                    serverVersion: '1.0.0',
                    serverDescription: 'A test server',
                    protocolVersion: '2025-03-26',
                    capabilities: { tools: {} },
                    instructions: null,
                    tools: [ { name: 'tool1', description: 'desc' } ],
                    resources: [],
                    prompts: [],
                    x402: {
                        version: 2,
                        restrictedCalls: [ 'tool1' ],
                        paymentOptions: [],
                        networks: [ 'BASE_MAINNET' ],
                        schemes: [ 'exact' ],
                        perTool: {}
                    },
                    oauth: {
                        issuer: null,
                        authorizationEndpoint: null,
                        tokenEndpoint: null,
                        registrationEndpoint: null,
                        revocationEndpoint: null,
                        scopesSupported: [],
                        grantTypesSupported: [],
                        responseTypesSupported: [],
                        pkceMethodsSupported: [],
                        clientIdMetadataDocumentSupported: false,
                        protectedResourceMetadataUrl: null,
                        mcpVersion: null
                    },
                    latency: { ping: 120, listTools: 250 },
                    timestamp: '2026-01-01T00:00:00.000Z'
                }
            }

            const layer2Result = {
                status: true,
                messages: [],
                categories: {
                    isReachable: true,
                    hasAgentCard: true,
                    hasValidStructure: true,
                    hasSkills: true,
                    supportsStreaming: false,
                    hasSecuritySchemes: true,
                    hasProvider: true,
                    supportsPushNotifications: false,
                    supportsJsonRpc: true,
                    supportsGrpc: false,
                    supportsExtendedCard: false,
                    hasDocumentation: true,
                    supportsAp2: false,
                    supportsX402: false,
                    supportsEmbeddedFlow: false,
                    hasErc8004ServiceLink: false
                },
                entries: {
                    url: 'https://mcp.example.com',
                    agentName: 'TestAgent',
                    agentDescription: 'A test agent',
                    agentVersion: '1.0.0',
                    providerOrganization: 'TestOrg',
                    providerUrl: 'https://test.org',
                    skillCount: 2,
                    skills: [ { id: 's1', name: 'Skill1' } ],
                    protocolBindings: [ 'jsonrpc' ],
                    protocolVersion: '1.0',
                    ap2Version: null,
                    ap2Roles: null,
                    x402Version: null,
                    erc8004ServiceUrl: null,
                    extensions: null,
                    timestamp: '2026-01-01T00:00:00.000Z'
                }
            }

            const layer3Result = {
                found: true,
                registrations: [ { agentId: '42', agentRegistry: '0x8004...', chainId: 8453 } ],
                verification: {
                    result: {
                        agentId: '42',
                        agentRegistry: '0x8004...',
                        chainId: 8453,
                        chainAlias: 'BASE_MAINNET',
                        registrationName: 'TestAgent',
                        registrationDescription: 'A test agent',
                        isOnChainVerified: true,
                        isSpecCompliant: true,
                        x402Support: true,
                        isActive: true,
                        services: null,
                        supportedTrust: null
                    },
                    rpcNode: 'https://base-mainnet.g.alchemy.com/v2/xxx'
                },
                messages: []
            }

            const layer4Result = {
                result: {
                    feedbackCount: 5,
                    averageValue: 450,
                    valueDecimals: 2,
                    validationCount: 3,
                    averageResponse: null
                },
                messages: []
            }

            const layer5Result = {
                status: true,
                messages: [],
                categories: {
                    isReachable: true,
                    supportsMcp: true,
                    supportsMcpApps: true,
                    hasUiResources: true,
                    hasUiToolLinkage: true,
                    hasValidUiHtml: true,
                    hasValidCsp: true,
                    supportsTheming: false,
                    supportsDisplayModes: false,
                    hasToolVisibility: true,
                    hasValidPermissions: true,
                    hasGracefulDegradation: false
                },
                entries: {
                    endpoint: TEST_ENDPOINT,
                    extensionVersion: '2026-01-26',
                    uiResourceCount: 1,
                    uiResources: [ { uri: 'ui://dashboard', name: 'Dashboard' } ],
                    uiLinkedToolCount: 1,
                    uiLinkedTools: [ { name: 'get_weather', resourceUri: 'ui://dashboard', visibility: [ 'model', 'app' ] } ],
                    appOnlyToolCount: 0,
                    cspSummary: { connectDomains: [], resourceDomains: [], frameDomains: [] },
                    permissionsSummary: [],
                    displayModes: [],
                    latency: { listResources: 80, readResource: 150 },
                    timestamp: '2026-01-01T00:00:00.000Z'
                }
            }

            const classifiedMessages = [
                { code: 'PRB-005', severity: 'INFO', layer: 1, location: null, message: 'PRB-005: No tools to probe' }
            ]

            const { status, categories, entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages,
                layer0Result: null,
                layer1Result,
                layer2Result,
                layer3Result,
                layer4Result,
                layer5Result
            } )

            expect( status ).toBe( true )

            expect( categories[ 'isReachable' ] ).toBe( true )
            expect( categories[ 'supportsMcp' ] ).toBe( true )
            expect( categories[ 'supportsX402' ] ).toBe( true )
            expect( categories[ 'hasA2aCard' ] ).toBe( true )
            expect( categories[ 'hasA2aValidStructure' ] ).toBe( true )
            expect( categories[ 'hasA2aSkills' ] ).toBe( true )
            expect( categories[ 'supportsA2aStreaming' ] ).toBe( false )
            expect( categories[ 'hasA2aSecuritySchemes' ] ).toBe( true )
            expect( categories[ 'hasA2aProvider' ] ).toBe( true )
            expect( categories[ 'supportsA2aPushNotifications' ] ).toBe( false )
            expect( categories[ 'supportsA2aJsonRpc' ] ).toBe( true )
            expect( categories[ 'supportsA2aGrpc' ] ).toBe( false )
            expect( categories[ 'supportsA2aExtendedCard' ] ).toBe( false )
            expect( categories[ 'hasA2aDocumentation' ] ).toBe( true )
            expect( categories[ 'supportsA2aAp2' ] ).toBe( false )
            expect( categories[ 'supportsA2aX402' ] ).toBe( false )
            expect( categories[ 'supportsA2aEmbeddedFlow' ] ).toBe( false )
            expect( categories[ 'hasA2aErc8004ServiceLink' ] ).toBe( false )
            expect( categories[ 'supportsLogging' ] ).toBe( false )
            expect( categories[ 'supportsCompletions' ] ).toBe( false )
            expect( categories[ 'supportsResourceSubscription' ] ).toBe( false )
            expect( categories[ 'supportsResourceListChanged' ] ).toBe( false )
            expect( categories[ 'supportsPromptListChanged' ] ).toBe( false )
            expect( categories[ 'supportsToolListChanged' ] ).toBe( false )
            expect( categories[ 'supportsTaskList' ] ).toBe( false )
            expect( categories[ 'supportsTaskCancel' ] ).toBe( false )
            expect( categories[ 'supportsTaskAugmentedToolCall' ] ).toBe( false )
            expect( categories[ 'hasExperimentalCapabilities' ] ).toBe( false )
            expect( categories[ 'specVersion' ] ).toBe( null )
            expect( categories[ 'uiSupportsMcpApps' ] ).toBe( true )
            expect( categories[ 'uiHasUiResources' ] ).toBe( true )
            expect( categories[ 'uiHasValidCsp' ] ).toBe( true )
            expect( categories[ 'hasWellKnownRegistration' ] ).toBe( true )
            expect( categories[ 'hasErc8004Registration' ] ).toBe( true )
            expect( categories[ 'isErc8004OnChainVerified' ] ).toBe( true )
            expect( categories[ 'isErc8004SpecCompliant' ] ).toBe( true )
            expect( categories[ 'hasOnChainReputation' ] ).toBe( true )
            expect( categories[ 'supportsOAuth' ] ).toBe( false )
            expect( categories[ 'hasValidOAuthConfig' ] ).toBe( false )
            expect( categories[ 'overallHealthy' ] ).toBe( true )

            expect( entries[ 'endpoint' ] ).toBe( TEST_ENDPOINT )
            expect( entries[ 'mcp' ][ 'serverName' ] ).toBe( 'TestServer' )
            expect( entries[ 'mcp' ][ 'toolCount' ] ).toBe( 1 )
            expect( entries[ 'mcp' ][ 'oauth' ] ).not.toBeNull()
            expect( entries[ 'mcp' ][ 'oauth' ][ 'issuer' ] ).toBeNull()
            expect( entries[ 'mcp' ][ 'specVersion' ] ).toBe( null )
            expect( entries[ 'mcp' ][ 'experimentalCapabilities' ] ).toBe( null )
            expect( entries[ 'mcp' ][ 'taskCapabilities' ] ).toBe( null )
            expect( entries[ 'a2a' ][ 'agentName' ] ).toBe( 'TestAgent' )
            expect( entries[ 'a2a' ][ 'ap2Version' ] ).toBe( null )
            expect( entries[ 'a2a' ][ 'ap2Roles' ] ).toBe( null )
            expect( entries[ 'a2a' ][ 'x402Version' ] ).toBe( null )
            expect( entries[ 'a2a' ][ 'erc8004ServiceUrl' ] ).toBe( null )
            expect( entries[ 'a2a' ][ 'extensions' ] ).toBe( null )
            expect( entries[ 'ui' ][ 'extensionVersion' ] ).toBe( '2026-01-26' )
            expect( entries[ 'ui' ][ 'uiResourceCount' ] ).toBe( 1 )
            expect( entries[ 'erc8004' ][ 'agentId' ] ).toBe( '42' )
            expect( entries[ 'reputation' ][ 'feedbackCount' ] ).toBe( 5 )
            expect( entries[ 'assessment' ][ 'grade' ] ).toBe( 'A' )
            expect( entries[ 'assessment' ][ 'infoCount' ] ).toBe( 1 )
        } )


        test( 'sets status false when ERROR messages present', () => {
            const classifiedMessages = [
                { code: 'CON-001', severity: 'ERROR', layer: 1, location: 'endpoint', message: 'CON-001 endpoint: Not reachable' }
            ]

            const { status, categories, entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages,
                layer1Result: { status: false, messages: [], categories: {}, entries: {} },
                layer2Result: null,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( status ).toBe( false )
            expect( categories[ 'overallHealthy' ] ).toBe( false )
            expect( entries[ 'assessment' ][ 'grade' ] ).toBe( 'C' )
            expect( entries[ 'assessment' ][ 'errorCount' ] ).toBe( 1 )
        } )


        test( 'assigns grade B with warnings but no errors', () => {
            const classifiedMessages = [
                { code: 'PAY-083', severity: 'WARNING', layer: 1, location: 'payTo', message: 'PAY-083 payTo: Not checksummed' },
                { code: 'CSV-020', severity: 'WARNING', layer: 2, location: null, message: 'CSV-020: Missing field' }
            ]

            const { status, entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages,
                layer1Result: { status: true, messages: [], categories: { isReachable: true }, entries: {} },
                layer2Result: null,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( status ).toBe( true )
            expect( entries[ 'assessment' ][ 'grade' ] ).toBe( 'B' )
            expect( entries[ 'assessment' ][ 'warningCount' ] ).toBe( 2 )
        } )


        test( 'returns null for a2a when no agent card data', () => {
            const { entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages: [],
                layer1Result: { status: true, messages: [], categories: {}, entries: {} },
                layer2Result: null,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( entries[ 'a2a' ] ).toBe( null )
        } )


        test( 'returns null for ui when no UI data', () => {
            const { entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages: [],
                layer1Result: { status: true, messages: [], categories: {}, entries: {} },
                layer2Result: null,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( entries[ 'ui' ] ).toBe( null )
        } )


        test( 'returns null for erc8004 when no config provided', () => {
            const { entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages: [],
                layer1Result: { status: true, messages: [], categories: {}, entries: {} },
                layer2Result: null,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( entries[ 'erc8004' ] ).toBe( null )
        } )


        test( 'returns null for reputation when no data', () => {
            const { entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages: [],
                layer1Result: { status: true, messages: [], categories: {}, entries: {} },
                layer2Result: null,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( entries[ 'reputation' ] ).toBe( null )
        } )


        test( 'maps new Layer 1 MCP capabilities to assessment categories', () => {
            const layer1Result = {
                status: true,
                messages: [],
                categories: {
                    isReachable: true,
                    supportsMcp: true,
                    hasTools: true,
                    hasResources: false,
                    hasPrompts: false,
                    supportsX402: false,
                    hasValidPaymentRequirements: false,
                    supportsExactScheme: false,
                    supportsEvm: false,
                    supportsSolana: false,
                    supportsTasks: true,
                    supportsMcpApps: false,
                    supportsLogging: true,
                    supportsCompletions: true,
                    supportsResourceSubscription: true,
                    supportsResourceListChanged: true,
                    supportsPromptListChanged: false,
                    supportsToolListChanged: true,
                    supportsTaskList: true,
                    supportsTaskCancel: true,
                    supportsTaskAugmentedToolCall: false,
                    hasExperimentalCapabilities: true,
                    specVersion: '2025-03-26',
                    supportsOAuth: false,
                    hasProtectedResourceMetadata: false,
                    hasAuthServerMetadata: false,
                    supportsPkce: false,
                    hasDynamicRegistration: false,
                    hasValidOAuthConfig: false
                },
                entries: {}
            }

            const { categories } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages: [],
                layer1Result,
                layer2Result: null,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( categories[ 'supportsLogging' ] ).toBe( true )
            expect( categories[ 'supportsCompletions' ] ).toBe( true )
            expect( categories[ 'supportsResourceSubscription' ] ).toBe( true )
            expect( categories[ 'supportsResourceListChanged' ] ).toBe( true )
            expect( categories[ 'supportsPromptListChanged' ] ).toBe( false )
            expect( categories[ 'supportsToolListChanged' ] ).toBe( true )
            expect( categories[ 'supportsTaskList' ] ).toBe( true )
            expect( categories[ 'supportsTaskCancel' ] ).toBe( true )
            expect( categories[ 'supportsTaskAugmentedToolCall' ] ).toBe( false )
            expect( categories[ 'hasExperimentalCapabilities' ] ).toBe( true )
            expect( categories[ 'specVersion' ] ).toBe( '2025-03-26' )
        } )


        test( 'maps new Layer 2 A2A extensions to assessment categories', () => {
            const layer2Result = {
                status: true,
                messages: [],
                categories: {
                    isReachable: true,
                    hasAgentCard: true,
                    hasValidStructure: true,
                    hasSkills: true,
                    supportsStreaming: false,
                    hasSecuritySchemes: false,
                    hasProvider: false,
                    supportsPushNotifications: false,
                    supportsJsonRpc: true,
                    supportsGrpc: false,
                    supportsExtendedCard: false,
                    hasDocumentation: false,
                    supportsAp2: true,
                    supportsX402: true,
                    supportsEmbeddedFlow: true,
                    hasErc8004ServiceLink: true
                },
                entries: {
                    agentName: 'TestAgent',
                    agentDescription: 'Test',
                    agentVersion: '1.0.0',
                    providerOrganization: null,
                    providerUrl: null,
                    skillCount: 0,
                    skills: [],
                    protocolBindings: [],
                    protocolVersion: '1.0',
                    ap2Version: '0.2.0',
                    ap2Roles: [ 'merchant' ],
                    x402Version: '0.1',
                    erc8004ServiceUrl: 'https://registry.example.com',
                    extensions: { 'x-custom': true }
                }
            }

            const { categories, entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages: [],
                layer1Result: { status: true, messages: [], categories: { isReachable: true }, entries: {} },
                layer2Result,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( categories[ 'supportsA2aAp2' ] ).toBe( true )
            expect( categories[ 'supportsA2aX402' ] ).toBe( true )
            expect( categories[ 'supportsA2aEmbeddedFlow' ] ).toBe( true )
            expect( categories[ 'hasA2aErc8004ServiceLink' ] ).toBe( true )
            expect( entries[ 'a2a' ][ 'ap2Version' ] ).toBe( '0.2.0' )
            expect( entries[ 'a2a' ][ 'ap2Roles' ] ).toEqual( [ 'merchant' ] )
            expect( entries[ 'a2a' ][ 'x402Version' ] ).toBe( '0.1' )
            expect( entries[ 'a2a' ][ 'erc8004ServiceUrl' ] ).toBe( 'https://registry.example.com' )
            expect( entries[ 'a2a' ][ 'extensions' ] ).toEqual( { 'x-custom': true } )
        } )


        test( 'includes new MCP entries in assessment', () => {
            const layer1Result = {
                status: true,
                messages: [],
                categories: { isReachable: true, supportsMcp: true },
                entries: {
                    serverName: 'TestServer',
                    serverVersion: '1.0.0',
                    serverDescription: 'Test',
                    protocolVersion: '2025-03-26',
                    capabilities: { tools: {} },
                    instructions: null,
                    tools: [],
                    resources: [],
                    prompts: [],
                    x402: null,
                    oauth: null,
                    latency: null,
                    specVersion: '2025-03-26',
                    experimentalCapabilities: { 'custom-feature': true },
                    taskCapabilities: { list: true, cancel: true }
                }
            }

            const { entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages: [],
                layer1Result,
                layer2Result: null,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( entries[ 'mcp' ][ 'specVersion' ] ).toBe( '2025-03-26' )
            expect( entries[ 'mcp' ][ 'experimentalCapabilities' ] ).toEqual( { 'custom-feature': true } )
            expect( entries[ 'mcp' ][ 'taskCapabilities' ] ).toEqual( { list: true, cancel: true } )
        } )


        test( 'includes new A2A entries in assessment', () => {
            const layer2Result = {
                status: true,
                messages: [],
                categories: { isReachable: true, hasValidStructure: true },
                entries: {
                    agentName: 'TestAgent',
                    agentDescription: 'Test',
                    agentVersion: '2.0.0',
                    providerOrganization: 'Org',
                    providerUrl: 'https://org.com',
                    skillCount: 1,
                    skills: [ { id: 's1', name: 'Skill1' } ],
                    protocolBindings: [ 'jsonrpc' ],
                    protocolVersion: '1.0',
                    ap2Version: '0.2.0',
                    ap2Roles: [ 'merchant', 'shopper' ],
                    x402Version: '0.1',
                    erc8004ServiceUrl: 'https://registry.example.com/.well-known/agent-registration.json',
                    extensions: { 'x-payment': { enabled: true } }
                }
            }

            const { entries } = AssessmentBuilder.build( {
                endpoint: TEST_ENDPOINT,
                classifiedMessages: [],
                layer1Result: { status: true, messages: [], categories: {}, entries: {} },
                layer2Result,
                layer3Result: null,
                layer4Result: null,
                layer5Result: null
            } )

            expect( entries[ 'a2a' ][ 'ap2Version' ] ).toBe( '0.2.0' )
            expect( entries[ 'a2a' ][ 'ap2Roles' ] ).toEqual( [ 'merchant', 'shopper' ] )
            expect( entries[ 'a2a' ][ 'x402Version' ] ).toBe( '0.1' )
            expect( entries[ 'a2a' ][ 'erc8004ServiceUrl' ] ).toBe( 'https://registry.example.com/.well-known/agent-registration.json' )
            expect( entries[ 'a2a' ][ 'extensions' ] ).toEqual( { 'x-payment': { enabled: true } } )
        } )

    } )

} )
