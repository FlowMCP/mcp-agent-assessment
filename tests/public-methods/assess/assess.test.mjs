import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'

import { TEST_ENDPOINT, TEST_ORIGIN, TEST_TIMEOUT, TEST_ERC8004_CONFIG } from '../../helpers/config.mjs'


const mockMcpStart = jest.fn()
const mockA2aStart = jest.fn()
const mockUiStart = jest.fn()

jest.unstable_mockModule( 'x402-mcp-validator', () => ( {
    McpServerValidator: {
        start: mockMcpStart,
        compare: jest.fn()
    }
} ) )

jest.unstable_mockModule( 'a2a-agent-validator', () => ( {
    A2aAgentValidator: {
        start: mockA2aStart,
        compare: jest.fn()
    }
} ) )

jest.unstable_mockModule( 'mcp-apps-validator', () => ( {
    McpAppsValidator: {
        start: mockUiStart,
        compare: jest.fn()
    }
} ) )

const originalFetch = global.fetch

const MOCK_MCP_RESULT = {
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
        serverDescription: 'Test MCP Server',
        protocolVersion: '2025-03-26',
        capabilities: { tools: {} },
        instructions: null,
        tools: [ { name: 'paywall_search', description: 'Search behind paywall' } ],
        resources: [],
        prompts: [],
        x402: {
            version: 2,
            restrictedCalls: [ 'paywall_search' ],
            paymentOptions: [],
            networks: [ 'BASE_MAINNET' ],
            schemes: [ 'exact' ],
            perTool: {}
        },
        oauth: null,
        latency: { ping: 100, listTools: 200 },
        timestamp: '2026-01-01T00:00:00.000Z'
    }
}

const MOCK_A2A_RESULT = {
    status: true,
    messages: [],
    categories: {
        isReachable: true,
        hasAgentCard: true,
        hasValidStructure: true,
        hasSkills: true,
        supportsStreaming: false,
        supportsPushNotifications: false,
        supportsExtendedCard: false,
        supportsAp2: false,
        hasErc8004ServiceLink: false
    },
    entries: {
        url: TEST_ORIGIN,
        agentName: 'TestAgent',
        agentDescription: 'A test A2A agent',
        agentVersion: '1.0.0',
        providerOrganization: 'TestOrg',
        providerUrl: 'https://testorg.com',
        skillCount: 1,
        skills: [ { id: 'search', name: 'Search' } ],
        protocolBindings: [ 'jsonrpc' ],
        protocolVersion: '1.0',
        ap2Version: null,
        erc8004ServiceUrl: null,
        extensions: null,
        timestamp: '2026-01-01T00:00:00.000Z'
    }
}

const MOCK_MCP_FAILURE = {
    status: false,
    messages: [ 'CON-001 endpoint: Server is not reachable' ],
    categories: {
        isReachable: false,
        supportsMcp: false,
        hasTools: false,
        hasResources: false,
        hasPrompts: false,
        supportsX402: false,
        hasValidPaymentRequirements: false,
        supportsExactScheme: false,
        supportsEvm: false,
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
        serverName: null,
        serverVersion: null,
        serverDescription: null,
        protocolVersion: null,
        capabilities: {},
        instructions: null,
        tools: [],
        resources: [],
        prompts: [],
        x402: { version: null, restrictedCalls: [], paymentOptions: [], networks: [], schemes: [], perTool: {} },
        oauth: null,
        latency: { ping: null, listTools: null },
        timestamp: '2026-01-01T00:00:00.000Z'
    }
}

const MOCK_A2A_NOT_FOUND = {
    status: false,
    messages: [ 'CON-010: Agent card not reachable' ],
    categories: {
        isReachable: false,
        hasAgentCard: false,
        hasValidStructure: false,
        hasSkills: false,
        supportsStreaming: false,
        supportsPushNotifications: false,
        supportsExtendedCard: false,
        supportsAp2: false,
        hasErc8004ServiceLink: false
    },
    entries: {
        url: TEST_ORIGIN,
        agentName: null,
        agentDescription: null,
        agentVersion: null,
        providerOrganization: null,
        providerUrl: null,
        skillCount: null,
        skills: null,
        protocolBindings: null,
        protocolVersion: null,
        ap2Version: null,
        erc8004ServiceUrl: null,
        extensions: null,
        timestamp: '2026-01-01T00:00:00.000Z'
    }
}

const MOCK_UI_RESULT = {
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
        serverName: 'TestServer',
        serverVersion: '1.0.0',
        serverDescription: 'Test',
        protocolVersion: '2025-03-26',
        extensionVersion: '2026-01-26',
        capabilities: {},
        uiResourceCount: 1,
        uiResources: [ { uri: 'ui://dashboard', name: 'Dashboard', mimeType: 'text/html;profile=mcp-app', hasCsp: true, hasPermissions: true, displayModes: [] } ],
        uiLinkedToolCount: 1,
        uiLinkedTools: [ { name: 'get_weather', resourceUri: 'ui://dashboard', visibility: [ 'model', 'app' ] } ],
        appOnlyToolCount: 0,
        cspSummary: { connectDomains: [], resourceDomains: [], frameDomains: [] },
        permissionsSummary: [],
        displayModes: [],
        tools: [],
        resources: [],
        latency: { listResources: 80, readResource: 150 },
        timestamp: '2026-01-01T00:00:00.000Z'
    }
}

const MOCK_UI_NOT_FOUND = {
    status: false,
    messages: [ 'CON-001 endpoint: Server is not reachable' ],
    categories: {
        isReachable: false,
        supportsMcp: false,
        supportsMcpApps: false,
        hasUiResources: false,
        hasUiToolLinkage: false,
        hasValidUiHtml: false,
        hasValidCsp: false,
        supportsTheming: false,
        supportsDisplayModes: false,
        hasToolVisibility: false,
        hasValidPermissions: false,
        hasGracefulDegradation: false
    },
    entries: {
        endpoint: TEST_ENDPOINT,
        serverName: null,
        serverVersion: null,
        serverDescription: null,
        protocolVersion: null,
        extensionVersion: null,
        capabilities: null,
        uiResourceCount: 0,
        uiResources: [],
        uiLinkedToolCount: 0,
        uiLinkedTools: [],
        appOnlyToolCount: 0,
        cspSummary: { connectDomains: [], resourceDomains: [], frameDomains: [] },
        permissionsSummary: [],
        displayModes: [],
        tools: [],
        resources: [],
        latency: { listResources: null, readResource: null },
        timestamp: '2026-01-01T00:00:00.000Z'
    }
}


describe( 'McpAgentAssessment.assess', () => {

    let McpAgentAssessment = null

    beforeEach( async () => {
        const mod = await import( '../../../src/McpAgentAssessment.mjs' )
        McpAgentAssessment = mod.McpAgentAssessment
        mockMcpStart.mockReset()
        mockA2aStart.mockReset()
        mockUiStart.mockReset()
        mockUiStart.mockResolvedValue( MOCK_UI_RESULT )
    } )

    afterEach( () => {
        global.fetch = originalFetch
    } )


    test( 'throws on missing endpoint', async () => {
        await expect( McpAgentAssessment.assess( {} ) ).rejects.toThrow( /ASM-001/ )
    } )


    test( 'throws on invalid endpoint', async () => {
        await expect( McpAgentAssessment.assess( { endpoint: 'not-a-url' } ) ).rejects.toThrow( /ASM-004/ )
    } )


    test( 'throws on invalid timeout', async () => {
        await expect( McpAgentAssessment.assess( { endpoint: TEST_ENDPOINT, timeout: -1 } ) ).rejects.toThrow( /ASM-006/ )
    } )


    test( 'throws on invalid erc8004 config', async () => {
        await expect( McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            erc8004: { rpcNodes: [] }
        } ) ).rejects.toThrow( /ASM-012/ )
    } )


    test( 'throws on empty rpcNodes', async () => {
        await expect( McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            erc8004: { rpcNodes: {} }
        } ) ).rejects.toThrow( /ASM-013/ )
    } )


    test( 'returns healthy assessment when MCP and A2A succeed', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )
        mockUiStart.mockResolvedValue( MOCK_UI_RESULT )

        const result = await McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            timeout: TEST_TIMEOUT
        } )

        expect( result[ 'status' ] ).toBe( true )
        expect( result[ 'categories' ][ 'isReachable' ] ).toBe( true )
        expect( result[ 'categories' ][ 'supportsMcp' ] ).toBe( true )
        expect( result[ 'categories' ][ 'hasA2aCard' ] ).toBe( true )
        expect( result[ 'categories' ][ 'overallHealthy' ] ).toBe( true )
        expect( result[ 'categories' ][ 'uiSupportsMcpApps' ] ).toBe( true )
        expect( result[ 'categories' ][ 'uiHasUiResources' ] ).toBe( true )

        expect( result[ 'entries' ][ 'endpoint' ] ).toBe( TEST_ENDPOINT )
        expect( result[ 'entries' ][ 'mcp' ][ 'serverName' ] ).toBe( 'TestServer' )
        expect( result[ 'entries' ][ 'mcp' ][ 'toolCount' ] ).toBe( 1 )
        expect( result[ 'entries' ][ 'a2a' ][ 'agentName' ] ).toBe( 'TestAgent' )
        expect( result[ 'entries' ][ 'ui' ][ 'extensionVersion' ] ).toBe( '2026-01-26' )
        expect( result[ 'entries' ][ 'ui' ][ 'uiResourceCount' ] ).toBe( 1 )
        expect( result[ 'entries' ][ 'assessment' ][ 'grade' ] ).toBe( 'A' )

        expect( result[ 'layers' ][ 'mcp' ] ).toBeDefined()
        expect( result[ 'layers' ][ 'a2a' ] ).toBeDefined()
        expect( result[ 'layers' ][ 'ui' ] ).toBeDefined()
        expect( result[ 'layers' ][ 'erc8004' ] ).toBe( null )
        expect( result[ 'layers' ][ 'reputation' ] ).toBe( null )
    } )


    test( 'returns unhealthy assessment when MCP fails', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_FAILURE )
        mockA2aStart.mockResolvedValue( MOCK_A2A_NOT_FOUND )
        mockUiStart.mockResolvedValue( MOCK_UI_NOT_FOUND )

        const result = await McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            timeout: TEST_TIMEOUT
        } )

        expect( result[ 'status' ] ).toBe( false )
        expect( result[ 'categories' ][ 'isReachable' ] ).toBe( false )
        expect( result[ 'categories' ][ 'overallHealthy' ] ).toBe( false )
        expect( result[ 'entries' ][ 'assessment' ][ 'grade' ] ).toBe( 'C' )
        expect( result[ 'entries' ][ 'assessment' ][ 'errorCount' ] ).toBeGreaterThan( 0 )
    } )


    test( 'classifies MCP errors as ERROR severity', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_FAILURE )
        mockA2aStart.mockResolvedValue( MOCK_A2A_NOT_FOUND )
        mockUiStart.mockResolvedValue( MOCK_UI_NOT_FOUND )

        const result = await McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            timeout: TEST_TIMEOUT
        } )

        const errors = result[ 'messages' ]
            .filter( ( msg ) => {
                const isError = msg[ 'severity' ] === 'ERROR'

                return isError
            } )

        expect( errors.length ).toBeGreaterThan( 0 )
        expect( errors[ 0 ][ 'code' ] ).toBe( 'CON-001' )
        expect( errors[ 0 ][ 'layer' ] ).toBe( 1 )
    } )


    test( 'classifies A2A not-found as INFO severity', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_NOT_FOUND )

        const result = await McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            timeout: TEST_TIMEOUT
        } )

        const a2aMessages = result[ 'messages' ]
            .filter( ( msg ) => {
                const isLayer2 = msg[ 'layer' ] === 2

                return isLayer2
            } )

        expect( a2aMessages.length ).toBeGreaterThan( 0 )
        expect( a2aMessages[ 0 ][ 'severity' ] ).toBe( 'INFO' )
    } )


    test( 'skips ERC-8004 layers when no erc8004 config', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )

        const result = await McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT
        } )

        expect( result[ 'layers' ][ 'erc8004' ] ).toBe( null )
        expect( result[ 'layers' ][ 'reputation' ] ).toBe( null )
        expect( result[ 'entries' ][ 'erc8004' ] ).toBe( null )
        expect( result[ 'entries' ][ 'reputation' ] ).toBe( null )
        expect( result[ 'categories' ][ 'hasWellKnownRegistration' ] ).toBe( false )
    } )


    test( 'runs ERC-8004 layer when config provided', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )

        global.fetch = jest.fn( () => {
            const result = Promise.resolve( { ok: false, status: 404 } )

            return result
        } )

        const result = await McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            timeout: TEST_TIMEOUT,
            erc8004: TEST_ERC8004_CONFIG
        } )

        expect( result[ 'layers' ][ 'erc8004' ] ).toBeDefined()
        expect( result[ 'layers' ][ 'erc8004' ][ 'found' ] ).toBe( false )
        expect( result[ 'categories' ][ 'hasWellKnownRegistration' ] ).toBe( false )
    } )


    test( 'uses origin for A2A endpoint (RFC 8615)', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )

        await McpAgentAssessment.assess( {
            endpoint: 'https://mcp.example.com/api/v1/mcp/sse',
            timeout: TEST_TIMEOUT
        } )

        const a2aCall = mockA2aStart.mock.calls[ 0 ][ 0 ]

        expect( a2aCall[ 'endpoint' ] ).toBe( 'https://mcp.example.com' )
    } )


    test( 'returns messages array with classified entries', async () => {
        mockMcpStart.mockResolvedValue( {
            ...MOCK_MCP_RESULT,
            messages: [ 'PAY-083 payTo: Address is not checksummed' ]
        } )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )

        const result = await McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            timeout: TEST_TIMEOUT
        } )

        expect( result[ 'messages' ].length ).toBeGreaterThan( 0 )

        const warningMsg = result[ 'messages' ][ 0 ]

        expect( warningMsg[ 'code' ] ).toBe( 'PAY-083' )
        expect( warningMsg[ 'severity' ] ).toBe( 'WARNING' )
        expect( warningMsg[ 'layer' ] ).toBe( 1 )
        expect( warningMsg[ 'location' ] ).toBe( 'payTo' )
        expect( warningMsg[ 'message' ] ).toBe( 'PAY-083 payTo: Address is not checksummed' )
    } )


    test( 'handles default timeout', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )

        const result = await McpAgentAssessment.assess( { endpoint: TEST_ENDPOINT } )

        expect( result[ 'status' ] ).toBe( true )
    } )


    test( 'runs UI layer in parallel with MCP and A2A', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )
        mockUiStart.mockResolvedValue( MOCK_UI_RESULT )

        await McpAgentAssessment.assess( { endpoint: TEST_ENDPOINT } )

        expect( mockUiStart ).toHaveBeenCalledTimes( 1 )
        expect( mockUiStart.mock.calls[ 0 ][ 0 ][ 'endpoint' ] ).toBe( TEST_ENDPOINT )
    } )


    test( 'returns null ui entries when no UI resources found', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )
        mockUiStart.mockResolvedValue( MOCK_UI_NOT_FOUND )

        const result = await McpAgentAssessment.assess( { endpoint: TEST_ENDPOINT } )

        expect( result[ 'categories' ][ 'uiSupportsMcpApps' ] ).toBe( false )
        expect( result[ 'entries' ][ 'ui' ] ).toBe( null )
        expect( result[ 'layers' ][ 'ui' ] ).toBeDefined()
    } )


    test( 'classifies UI messages as Layer 5', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )
        mockUiStart.mockResolvedValue( {
            ...MOCK_UI_RESULT,
            status: false,
            messages: [ 'UIV-020 ui://dashboard: No CSP configuration declared' ]
        } )

        const result = await McpAgentAssessment.assess( { endpoint: TEST_ENDPOINT } )

        const uiMessages = result[ 'messages' ]
            .filter( ( msg ) => {
                const isLayer5 = msg[ 'layer' ] === 5

                return isLayer5
            } )

        expect( uiMessages.length ).toBeGreaterThan( 0 )
        expect( uiMessages[ 0 ][ 'code' ] ).toBe( 'UIV-020' )
        expect( uiMessages[ 0 ][ 'severity' ] ).toBe( 'WARNING' )
    } )


    test( 'triggers ERC-8004 lookup when A2A card has erc8004ServiceUrl', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( {
            ...MOCK_A2A_RESULT,
            categories: {
                ...MOCK_A2A_RESULT[ 'categories' ],
                hasErc8004ServiceLink: true
            },
            entries: {
                ...MOCK_A2A_RESULT[ 'entries' ],
                erc8004ServiceUrl: 'https://registry.example.com/.well-known/agent-registration.json'
            }
        } )
        mockUiStart.mockResolvedValue( MOCK_UI_RESULT )

        global.fetch = jest.fn( () => {
            const result = Promise.resolve( {
                ok: true,
                status: 200,
                text: () => Promise.resolve( JSON.stringify( {
                    registrations: [
                        { agentId: '99', agentRegistry: '0x8004...', chainId: 8453, name: 'DerivedAgent' }
                    ]
                } ) )
            } )

            return result
        } )

        const result = await McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            timeout: TEST_TIMEOUT
        } )

        expect( result[ 'layers' ][ 'erc8004' ] ).not.toBe( null )
        expect( result[ 'layers' ][ 'erc8004' ][ 'found' ] ).toBe( true )
        expect( result[ 'layers' ][ 'erc8004' ][ 'registrations' ] ).toHaveLength( 1 )
        expect( result[ 'categories' ][ 'hasWellKnownRegistration' ] ).toBe( true )
    } )


    test( 'skips derived ERC-8004 lookup when erc8004ServiceUrl is null', async () => {
        mockMcpStart.mockResolvedValue( MOCK_MCP_RESULT )
        mockA2aStart.mockResolvedValue( MOCK_A2A_RESULT )
        mockUiStart.mockResolvedValue( MOCK_UI_RESULT )

        const result = await McpAgentAssessment.assess( {
            endpoint: TEST_ENDPOINT,
            timeout: TEST_TIMEOUT
        } )

        expect( result[ 'layers' ][ 'erc8004' ] ).toBe( null )
        expect( result[ 'categories' ][ 'hasWellKnownRegistration' ] ).toBe( false )
    } )

} )
