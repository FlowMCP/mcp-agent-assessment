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
                layer4Messages: [ 'REP-001: No data' ]
            } )

            expect( classified ).toHaveLength( 4 )
            expect( classified[ 0 ][ 'layer' ] ).toBe( 1 )
            expect( classified[ 1 ][ 'layer' ] ).toBe( 2 )
            expect( classified[ 2 ][ 'layer' ] ).toBe( 3 )
            expect( classified[ 3 ][ 'layer' ] ).toBe( 4 )
        } )


        test( 'handles missing layer messages gracefully', () => {
            const { classified } = SeverityClassifier.classifyAll( {
                layer1Messages: [ 'CON-001 endpoint: Not reachable' ],
                layer2Messages: null,
                layer3Messages: undefined,
                layer4Messages: []
            } )

            expect( classified ).toHaveLength( 1 )
            expect( classified[ 0 ][ 'layer' ] ).toBe( 1 )
        } )


        test( 'returns empty array when all layers empty', () => {
            const { classified } = SeverityClassifier.classifyAll( {
                layer1Messages: [],
                layer2Messages: [],
                layer3Messages: [],
                layer4Messages: []
            } )

            expect( classified ).toHaveLength( 0 )
        } )

    } )

} )
