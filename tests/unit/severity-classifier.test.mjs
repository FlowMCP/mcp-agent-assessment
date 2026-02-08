import { SeverityClassifier } from '../../src/task/SeverityClassifier.mjs'


describe( 'SeverityClassifier', () => {

    describe( 'classify', () => {

        test( 'classifies Layer 1 ERROR codes correctly', () => {
            const messages = [
                'CON-001 endpoint: Server is not reachable',
                'PAY-060 amount: Must be a positive number'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 1 } )

            expect( classified ).toHaveLength( 2 )
            expect( classified[ 0 ][ 'severity' ] ).toBe( 'ERROR' )
            expect( classified[ 0 ][ 'code' ] ).toBe( 'CON-001' )
            expect( classified[ 0 ][ 'layer' ] ).toBe( 1 )
            expect( classified[ 0 ][ 'location' ] ).toBe( 'endpoint' )
            expect( classified[ 1 ][ 'severity' ] ).toBe( 'ERROR' )
            expect( classified[ 1 ][ 'code' ] ).toBe( 'PAY-060' )
        } )


        test( 'classifies Layer 1 WARNING codes correctly', () => {
            const messages = [
                'PAY-083 payTo: Address is not checksummed'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 1 } )

            expect( classified[ 0 ][ 'severity' ] ).toBe( 'WARNING' )
            expect( classified[ 0 ][ 'code' ] ).toBe( 'PAY-083' )
        } )


        test( 'classifies Layer 1 INFO codes correctly', () => {
            const messages = [
                'CON-010 resources/list: Method not supported',
                'PRB-005: No tools available to probe'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 1 } )

            expect( classified[ 0 ][ 'severity' ] ).toBe( 'INFO' )
            expect( classified[ 1 ][ 'severity' ] ).toBe( 'INFO' )
            expect( classified[ 1 ][ 'code' ] ).toBe( 'PRB-005' )
        } )


        test( 'classifies Layer 1 AUTH codes as INFO', () => {
            const messages = [
                'AUTH-002 oauth: Authorization Server Metadata not found',
                'AUTH-003 oauth: PKCE S256 not supported',
                'AUTH-010 oauth: Server requires authentication',
                'AUTH-011 oauth: Scopes found — mcp:tools'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 1 } )

            expect( classified ).toHaveLength( 4 )

            classified
                .forEach( ( msg ) => {
                    expect( msg[ 'severity' ] ).toBe( 'INFO' )
                } )

            expect( classified[ 0 ][ 'code' ] ).toBe( 'AUTH-002' )
            expect( classified[ 2 ][ 'code' ] ).toBe( 'AUTH-010' )
        } )


        test( 'classifies Layer 2 A2A codes as milder severity', () => {
            const messages = [
                'CON-010: Agent card not reachable',
                'CSV-020: Missing required field "name"'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 2 } )

            expect( classified[ 0 ][ 'severity' ] ).toBe( 'INFO' )
            expect( classified[ 1 ][ 'severity' ] ).toBe( 'WARNING' )
        } )


        test( 'classifies Layer 3 ERC-8004 codes correctly', () => {
            const messages = [
                'REG-001 well-known: File not found',
                'RPC-001 eth_call: Request failed',
                'RPC-003 registry: Agent not found'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 3 } )

            expect( classified[ 0 ][ 'severity' ] ).toBe( 'INFO' )
            expect( classified[ 1 ][ 'severity' ] ).toBe( 'ERROR' )
            expect( classified[ 2 ][ 'severity' ] ).toBe( 'WARNING' )
        } )


        test( 'classifies Layer 4 reputation codes correctly', () => {
            const messages = [
                'RPC-010 reputation: Query failed',
                'REP-001: No reputation data found'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 4 } )

            expect( classified[ 0 ][ 'severity' ] ).toBe( 'ERROR' )
            expect( classified[ 1 ][ 'severity' ] ).toBe( 'INFO' )
        } )


        test( 'classifies Layer 5 UI codes correctly', () => {
            const messages = [
                'CON-001 endpoint: Server not reachable',
                'UIV-020 ui://dashboard: No CSP configuration declared',
                'UIV-070 ui://dashboard: No graceful degradation'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 5 } )

            expect( classified[ 0 ][ 'severity' ] ).toBe( 'ERROR' )
            expect( classified[ 1 ][ 'severity' ] ).toBe( 'WARNING' )
            expect( classified[ 2 ][ 'severity' ] ).toBe( 'INFO' )
        } )


        test( 'classifies new Layer 5 error codes correctly', () => {
            const messages = [
                'UIV-013 ui://dashboard: HTML content appears invalid (missing doctype, html, or body tag)',
                'UIV-041 ui://dashboard: No display modes declared',
                'UIV-062 tools: No tools linked to UI resources',
                'UIV-063 incomplete_tool: Has UI metadata but no resourceUri',
                'UIV-080 capabilities: MCP Apps extension not declared (missing io.modelcontextprotocol/ui)',
                'UIV-081 capabilities: Extension version not specified'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 5 } )

            expect( classified[ 0 ][ 'code' ] ).toBe( 'UIV-013' )
            expect( classified[ 0 ][ 'severity' ] ).toBe( 'WARNING' )

            expect( classified[ 1 ][ 'code' ] ).toBe( 'UIV-041' )
            expect( classified[ 1 ][ 'severity' ] ).toBe( 'INFO' )

            expect( classified[ 2 ][ 'code' ] ).toBe( 'UIV-062' )
            expect( classified[ 2 ][ 'severity' ] ).toBe( 'INFO' )

            expect( classified[ 3 ][ 'code' ] ).toBe( 'UIV-063' )
            expect( classified[ 3 ][ 'severity' ] ).toBe( 'INFO' )

            expect( classified[ 4 ][ 'code' ] ).toBe( 'UIV-080' )
            expect( classified[ 4 ][ 'severity' ] ).toBe( 'INFO' )

            expect( classified[ 5 ][ 'code' ] ).toBe( 'UIV-081' )
            expect( classified[ 5 ][ 'severity' ] ).toBe( 'INFO' )
        } )


        test( 'defaults unknown codes to WARNING', () => {
            const messages = [
                'XYZ-999 unknown: Some unknown error'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 1 } )

            expect( classified[ 0 ][ 'severity' ] ).toBe( 'WARNING' )
            expect( classified[ 0 ][ 'code' ] ).toBe( 'XYZ-999' )
        } )


        test( 'handles messages without parseable code', () => {
            const messages = [
                'Some message without code prefix'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 1 } )

            expect( classified[ 0 ][ 'code' ] ).toBe( 'UNK-000' )
            expect( classified[ 0 ][ 'severity' ] ).toBe( 'WARNING' )
        } )


        test( 'extracts location from message', () => {
            const messages = [
                'CON-001 endpoint: Server is not reachable'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 1 } )

            expect( classified[ 0 ][ 'location' ] ).toBe( 'endpoint' )
        } )


        test( 'returns null location when no location in message', () => {
            const messages = [
                'PRB-005: No tools available to probe'
            ]

            const { classified } = SeverityClassifier.classify( { messages, layer: 1 } )

            expect( classified[ 0 ][ 'location' ] ).toBe( null )
        } )


        test( 'returns empty array for empty messages', () => {
            const { classified } = SeverityClassifier.classify( { messages: [], layer: 1 } )

            expect( classified ).toHaveLength( 0 )
        } )

    } )


    describe( 'classifyAll', () => {

        test( 'classifies messages from all layers', () => {
            const { classified } = SeverityClassifier.classifyAll( {
                layer1Messages: [ 'CON-001 endpoint: Server not reachable' ],
                layer2Messages: [ 'CSV-020: Missing field' ],
                layer3Messages: [ 'REG-001 well-known: Not found' ],
                layer4Messages: [ 'REP-001: No data' ],
                layer5Messages: [ 'UIV-020 ui://dashboard: No CSP' ]
            } )

            expect( classified ).toHaveLength( 5 )
            expect( classified[ 0 ][ 'layer' ] ).toBe( 1 )
            expect( classified[ 1 ][ 'layer' ] ).toBe( 2 )
            expect( classified[ 2 ][ 'layer' ] ).toBe( 3 )
            expect( classified[ 3 ][ 'layer' ] ).toBe( 4 )
            expect( classified[ 4 ][ 'layer' ] ).toBe( 5 )
        } )


        test( 'handles missing layer messages gracefully', () => {
            const { classified } = SeverityClassifier.classifyAll( {
                layer1Messages: [ 'CON-001 endpoint: Not reachable' ],
                layer2Messages: null,
                layer3Messages: undefined,
                layer4Messages: [],
                layer5Messages: null
            } )

            expect( classified ).toHaveLength( 1 )
            expect( classified[ 0 ][ 'layer' ] ).toBe( 1 )
        } )


        test( 'returns empty array when all layers empty', () => {
            const { classified } = SeverityClassifier.classifyAll( {
                layer1Messages: [],
                layer2Messages: [],
                layer3Messages: [],
                layer4Messages: [],
                layer5Messages: []
            } )

            expect( classified ).toHaveLength( 0 )
        } )

    } )

} )
