import { describe, test, expect, jest, beforeEach } from '@jest/globals'

import { TEST_ENDPOINT } from '../../helpers/config.mjs'


const mockMcpCompare = jest.fn()
const mockA2aCompare = jest.fn()
const mockUiCompare = jest.fn()

jest.unstable_mockModule( 'x402-mcp-validator', () => ( {
    McpServerValidator: {
        start: jest.fn(),
        compare: mockMcpCompare
    }
} ) )

jest.unstable_mockModule( 'a2a-agent-validator', () => ( {
    A2aAgentValidator: {
        start: jest.fn(),
        compare: mockA2aCompare
    }
} ) )

jest.unstable_mockModule( 'mcp-apps-validator', () => ( {
    McpAppsValidator: {
        start: jest.fn(),
        compare: mockUiCompare
    }
} ) )


const MOCK_MCP_LAYER = {
    status: true,
    messages: [],
    categories: { isReachable: true, supportsMcp: true, hasTools: true },
    entries: { endpoint: TEST_ENDPOINT, serverName: 'TestServer', timestamp: '2026-01-01T00:00:00.000Z' }
}

const MOCK_A2A_LAYER = {
    status: true,
    messages: [],
    categories: { isReachable: true, hasAgentCard: true },
    entries: { url: 'https://mcp.example.com', agentName: 'TestAgent', timestamp: '2026-01-01T00:00:00.000Z' }
}

const EMPTY_MCP_DIFF = {
    server: { changed: {} },
    capabilities: { added: {}, removed: {}, modified: {} },
    tools: { added: [], removed: [], modified: [] },
    x402: { toolsAdded: [], toolsRemoved: [], toolsModified: [], changed: {} },
    latency: { changed: {} },
    categories: { changed: {} }
}

const EMPTY_A2A_DIFF = {
    identity: { changed: {} },
    capabilities: { changed: {} },
    skills: { added: [], removed: [], modified: [] },
    interfaces: { added: [], removed: [] },
    security: { added: [], removed: [] },
    categories: { changed: {} }
}

const EMPTY_UI_DIFF = {
    server: { changed: {} },
    uiResources: { added: [], removed: [], modified: [] },
    uiLinkedTools: { added: [], removed: [], modified: [] },
    csp: { changed: {} },
    permissions: { added: [], removed: [] },
    latency: { changed: {} },
    categories: { changed: {} }
}

const MOCK_UI_LAYER = {
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
        uiResources: [ { uri: 'ui://dashboard', name: 'Dashboard', mimeType: 'text/html;profile=mcp-app', hasCsp: true, hasPermissions: true, displayModes: [] } ],
        timestamp: '2026-01-01T00:00:00.000Z'
    }
}


const makeAssessment = ( { overrides = {} } = {} ) => {
    const base = {
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
            hasA2aCard: true,
            hasA2aValidStructure: true,
            hasA2aSkills: true,
            supportsA2aStreaming: false,
            uiSupportsMcpApps: true,
            uiHasUiResources: true,
            uiHasToolLinkage: true,
            uiHasValidHtml: true,
            uiHasValidCsp: true,
            uiSupportsTheming: false,
            hasWellKnownRegistration: false,
            hasErc8004Registration: false,
            isErc8004OnChainVerified: false,
            isErc8004SpecCompliant: false,
            hasOnChainReputation: false,
            overallHealthy: true
        },
        entries: {
            endpoint: TEST_ENDPOINT,
            timestamp: '2026-01-01T00:00:00.000Z',
            mcp: { serverName: 'TestServer', toolCount: 1 },
            a2a: { agentName: 'TestAgent' },
            ui: { extensionVersion: '2026-01-26', uiResourceCount: 1 },
            erc8004: null,
            reputation: null,
            assessment: { errorCount: 0, warningCount: 0, infoCount: 0, grade: 'A' }
        },
        layers: {
            mcp: MOCK_MCP_LAYER,
            a2a: MOCK_A2A_LAYER,
            ui: MOCK_UI_LAYER,
            erc8004: null,
            reputation: null
        }
    }

    return { ...base, ...overrides }
}


describe( 'McpAgentAssessment.compare', () => {

    let McpAgentAssessment = null

    beforeEach( async () => {
        const mod = await import( '../../../src/McpAgentAssessment.mjs' )
        McpAgentAssessment = mod.McpAgentAssessment
        mockMcpCompare.mockReset()
        mockA2aCompare.mockReset()
        mockUiCompare.mockReset()
        mockUiCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_UI_DIFF } )
    } )


    test( 'throws on missing before', () => {
        expect( () => {
            McpAgentAssessment.compare( { after: makeAssessment() } )
        } ).toThrow( /ASM-020/ )
    } )


    test( 'throws on missing after', () => {
        expect( () => {
            McpAgentAssessment.compare( { before: makeAssessment() } )
        } ).toThrow( /ASM-023/ )
    } )


    test( 'throws on non-object before', () => {
        expect( () => {
            McpAgentAssessment.compare( { before: 'invalid', after: makeAssessment() } )
        } ).toThrow( /ASM-021/ )
    } )


    test( 'throws when before missing categories', () => {
        expect( () => {
            McpAgentAssessment.compare( {
                before: { entries: {} },
                after: makeAssessment()
            } )
        } ).toThrow( /ASM-022/ )
    } )


    test( 'returns no changes for identical assessments', () => {
        const assessment = makeAssessment()

        mockMcpCompare.mockReturnValue( {
            status: true,
            messages: [],
            hasChanges: false,
            diff: EMPTY_MCP_DIFF
        } )

        mockA2aCompare.mockReturnValue( {
            status: true,
            messages: [],
            hasChanges: false,
            diff: EMPTY_A2A_DIFF
        } )

        const result = McpAgentAssessment.compare( { before: assessment, after: assessment } )

        expect( result[ 'status' ] ).toBe( true )
        expect( result[ 'hasChanges' ] ).toBe( false )
        expect( result[ 'diff' ][ 'mcp' ] ).toEqual( EMPTY_MCP_DIFF )
        expect( result[ 'diff' ][ 'a2a' ] ).toEqual( EMPTY_A2A_DIFF )
        expect( result[ 'diff' ][ 'ui' ] ).toEqual( EMPTY_UI_DIFF )
    } )


    test( 'detects MCP changes', () => {
        const before = makeAssessment()
        const after = makeAssessment( {
            overrides: {
                entries: {
                    ...before[ 'entries' ],
                    timestamp: '2026-01-02T00:00:00.000Z',
                    mcp: { serverName: 'UpdatedServer', toolCount: 2 }
                }
            }
        } )

        const mcpDiff = {
            ...EMPTY_MCP_DIFF,
            server: { changed: { serverName: { before: 'TestServer', after: 'UpdatedServer' } } }
        }

        mockMcpCompare.mockReturnValue( { status: true, messages: [], hasChanges: true, diff: mcpDiff } )
        mockA2aCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_A2A_DIFF } )

        const result = McpAgentAssessment.compare( { before, after } )

        expect( result[ 'hasChanges' ] ).toBe( true )
        expect( result[ 'diff' ][ 'mcp' ][ 'server' ][ 'changed' ][ 'serverName' ] ).toBeDefined()
    } )


    test( 'detects grade changes in assessment diff', () => {
        const before = makeAssessment()
        const after = makeAssessment( {
            overrides: {
                entries: {
                    ...before[ 'entries' ],
                    timestamp: '2026-01-02T00:00:00.000Z',
                    assessment: { errorCount: 2, warningCount: 0, infoCount: 0, grade: 'C' }
                },
                categories: {
                    ...before[ 'categories' ],
                    overallHealthy: false
                }
            }
        } )

        mockMcpCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_MCP_DIFF } )
        mockA2aCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_A2A_DIFF } )

        const result = McpAgentAssessment.compare( { before, after } )

        expect( result[ 'hasChanges' ] ).toBe( true )
        expect( result[ 'diff' ][ 'assessment' ][ 'grade' ][ 'before' ] ).toBe( 'A' )
        expect( result[ 'diff' ][ 'assessment' ][ 'grade' ][ 'after' ] ).toBe( 'C' )
    } )


    test( 'detects erc8004 changes', () => {
        const before = makeAssessment( {
            overrides: {
                entries: {
                    ...makeAssessment()[ 'entries' ],
                    erc8004: { agentId: '42', isOnChainVerified: false, isSpecCompliant: false }
                }
            }
        } )

        const after = makeAssessment( {
            overrides: {
                entries: {
                    ...makeAssessment()[ 'entries' ],
                    timestamp: '2026-01-02T00:00:00.000Z',
                    erc8004: { agentId: '42', isOnChainVerified: true, isSpecCompliant: true }
                }
            }
        } )

        mockMcpCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_MCP_DIFF } )
        mockA2aCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_A2A_DIFF } )

        const result = McpAgentAssessment.compare( { before, after } )

        expect( result[ 'hasChanges' ] ).toBe( true )
        expect( result[ 'diff' ][ 'erc8004' ][ 'registration' ][ 'changed' ][ 'isOnChainVerified' ] ).toBeDefined()
    } )


    test( 'returns null for erc8004 diff when both null', () => {
        const assessment = makeAssessment()

        mockMcpCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_MCP_DIFF } )
        mockA2aCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_A2A_DIFF } )

        const result = McpAgentAssessment.compare( { before: assessment, after: assessment } )

        expect( result[ 'diff' ][ 'erc8004' ] ).toBe( null )
    } )


    test( 'returns null for reputation diff when both null', () => {
        const assessment = makeAssessment()

        mockMcpCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_MCP_DIFF } )
        mockA2aCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_A2A_DIFF } )

        const result = McpAgentAssessment.compare( { before: assessment, after: assessment } )

        expect( result[ 'diff' ][ 'reputation' ] ).toBe( null )
    } )


    test( 'adds integrity warning for different endpoints', () => {
        const before = makeAssessment()
        const after = makeAssessment( {
            overrides: {
                entries: {
                    ...makeAssessment()[ 'entries' ],
                    endpoint: 'https://other.example.com/sse',
                    timestamp: '2026-01-02T00:00:00.000Z'
                }
            }
        } )

        mockMcpCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_MCP_DIFF } )
        mockA2aCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_A2A_DIFF } )

        const result = McpAgentAssessment.compare( { before, after } )

        const hasIntegrity = result[ 'messages' ].some( ( m ) => {
            const match = m.includes( 'CMP-001' )

            return match
        } )

        expect( hasIntegrity ).toBe( true )
    } )


    test( 'detects UI changes via Layer 5 compare', () => {
        const before = makeAssessment()
        const after = makeAssessment()

        const uiDiffWithChanges = {
            ...EMPTY_UI_DIFF,
            uiResources: { added: [ 'ui://new-resource' ], removed: [], modified: [] }
        }

        mockMcpCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_MCP_DIFF } )
        mockA2aCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_A2A_DIFF } )
        mockUiCompare.mockReturnValue( { status: true, messages: [], hasChanges: true, diff: uiDiffWithChanges } )

        const result = McpAgentAssessment.compare( { before, after } )

        expect( result[ 'hasChanges' ] ).toBe( true )
        expect( result[ 'diff' ][ 'ui' ][ 'uiResources' ][ 'added' ] ).toContain( 'ui://new-resource' )
    } )


    test( 'returns null ui diff when no UI layers present', () => {
        const before = makeAssessment( {
            overrides: {
                layers: { mcp: MOCK_MCP_LAYER, a2a: MOCK_A2A_LAYER, ui: null, erc8004: null, reputation: null }
            }
        } )

        const after = makeAssessment( {
            overrides: {
                layers: { mcp: MOCK_MCP_LAYER, a2a: MOCK_A2A_LAYER, ui: null, erc8004: null, reputation: null }
            }
        } )

        mockMcpCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_MCP_DIFF } )
        mockA2aCompare.mockReturnValue( { status: true, messages: [], hasChanges: false, diff: EMPTY_A2A_DIFF } )

        const result = McpAgentAssessment.compare( { before, after } )

        expect( result[ 'diff' ][ 'ui' ] ).toBe( null )
    } )

} )
