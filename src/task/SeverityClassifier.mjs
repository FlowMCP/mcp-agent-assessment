class SeverityClassifier {


    static #LAYER_1_SEVERITY = {
        'CON-001': 'ERROR',
        'CON-002': 'ERROR',
        'CON-003': 'ERROR',
        'CON-004': 'ERROR',
        'CON-005': 'ERROR',
        'CON-006': 'ERROR',
        'CON-007': 'ERROR',
        'CON-008': 'WARNING',
        'CON-009': 'WARNING',
        'CON-010': 'INFO',
        'CON-011': 'INFO',
        'PAY-010': 'ERROR',
        'PAY-011': 'ERROR',
        'PAY-012': 'ERROR',
        'PAY-020': 'ERROR',
        'PAY-030': 'ERROR',
        'PAY-031': 'ERROR',
        'PAY-040': 'ERROR',
        'PAY-041': 'ERROR',
        'PAY-042': 'ERROR',
        'PAY-050': 'ERROR',
        'PAY-051': 'ERROR',
        'PAY-060': 'ERROR',
        'PAY-061': 'ERROR',
        'PAY-062': 'ERROR',
        'PAY-063': 'ERROR',
        'PAY-070': 'ERROR',
        'PAY-071': 'ERROR',
        'PAY-072': 'ERROR',
        'PAY-080': 'ERROR',
        'PAY-081': 'ERROR',
        'PAY-082': 'ERROR',
        'PAY-083': 'WARNING',
        'PAY-090': 'ERROR',
        'PAY-091': 'ERROR',
        'PAY-100': 'INFO',
        'PAY-101': 'INFO',
        'PAY-102': 'INFO',
        'PRB-001': 'INFO',
        'PRB-002': 'INFO',
        'PRB-003': 'INFO',
        'PRB-004': 'INFO',
        'PRB-005': 'INFO',
        'AUTH-001': 'INFO',
        'AUTH-002': 'INFO',
        'AUTH-003': 'INFO',
        'AUTH-004': 'INFO',
        'AUTH-005': 'INFO',
        'AUTH-010': 'INFO',
        'AUTH-011': 'INFO'
    }


    static #LAYER_2_SEVERITY = {
        'CON-010': 'INFO',
        'CON-011': 'INFO',
        'CON-012': 'INFO',
        'CON-013': 'INFO',
        'CON-014': 'INFO',
        'CSV-020': 'WARNING',
        'CSV-021': 'WARNING',
        'CSV-022': 'WARNING',
        'CSV-023': 'WARNING',
        'CSV-024': 'WARNING',
        'CSV-025': 'WARNING',
        'CSV-026': 'WARNING',
        'CSV-027': 'WARNING',
        'CSV-028': 'WARNING',
        'CSV-029': 'WARNING',
        'CSV-030': 'WARNING',
        'CSV-031': 'WARNING',
        'CSV-032': 'WARNING',
        'CSV-033': 'WARNING',
        'CSV-034': 'WARNING',
        'CSV-035': 'WARNING',
        'CSV-036': 'WARNING',
        'CSV-037': 'WARNING',
        'CSV-038': 'WARNING',
        'CSV-039': 'WARNING',
        'CSV-040': 'WARNING',
        'CSV-041': 'WARNING',
        'VAL-001': 'WARNING',
        'VAL-002': 'WARNING',
        'VAL-003': 'WARNING',
        'VAL-004': 'WARNING'
    }


    static #LAYER_3_SEVERITY = {
        'REG-001': 'INFO',
        'REG-002': 'WARNING',
        'REG-003': 'WARNING',
        'REG-010': 'WARNING',
        'REG-011': 'WARNING',
        'REG-012': 'WARNING',
        'REG-013': 'WARNING',
        'REG-014': 'WARNING',
        'REG-015': 'WARNING',
        'REG-016': 'WARNING',
        'REG-017': 'WARNING',
        'REG-018': 'WARNING',
        'REG-020': 'WARNING',
        'REG-021': 'WARNING',
        'REG-022': 'WARNING',
        'REG-023': 'WARNING',
        'REG-024': 'WARNING',
        'REG-025': 'WARNING',
        'REG-026': 'WARNING',
        'REG-027': 'WARNING',
        'REG-030': 'WARNING',
        'REG-031': 'WARNING',
        'REG-032': 'WARNING',
        'REG-033': 'WARNING',
        'REG-034': 'WARNING',
        'REG-035': 'WARNING',
        'REG-036': 'WARNING',
        'REG-040': 'INFO',
        'RPC-001': 'ERROR',
        'RPC-002': 'ERROR',
        'RPC-003': 'WARNING',
        'EVT-001': 'WARNING',
        'EVT-002': 'WARNING',
        'EVT-003': 'WARNING',
        'EVT-004': 'WARNING',
        'EVT-005': 'WARNING',
        'EVT-006': 'WARNING',
        'EVT-007': 'WARNING',
        'URI-001': 'INFO',
        'URI-002': 'INFO',
        'URI-003': 'WARNING',
        'URI-004': 'INFO',
        'URI-005': 'INFO',
        'URI-006': 'WARNING',
        'URI-007': 'WARNING',
        'URI-008': 'WARNING',
        'URI-009': 'WARNING',
        'VAL-001': 'WARNING',
        'VAL-002': 'WARNING',
        'VAL-003': 'WARNING',
        'VAL-004': 'WARNING',
        'VAL-005': 'WARNING',
        'VAL-006': 'WARNING',
        'VAL-007': 'WARNING',
        'VAL-008': 'WARNING',
        'VAL-009': 'WARNING',
        'VAL-010': 'WARNING'
    }


    static #LAYER_4_SEVERITY = {
        'RPC-010': 'ERROR',
        'REP-001': 'INFO'
    }


    static #LAYER_5_SEVERITY = {
        'CON-001': 'ERROR',
        'CON-004': 'ERROR',
        'CON-008': 'WARNING',
        'CON-010': 'WARNING',
        'UIR-001': 'WARNING',
        'UIR-002': 'WARNING',
        'UIV-010': 'WARNING',
        'UIV-011': 'WARNING',
        'UIV-012': 'WARNING',
        'UIV-020': 'WARNING',
        'UIV-021': 'WARNING',
        'UIV-022': 'WARNING',
        'UIV-030': 'WARNING',
        'UIV-031': 'WARNING',
        'UIV-040': 'INFO',
        'UIV-041': 'INFO',
        'UIV-050': 'INFO',
        'UIV-060': 'WARNING',
        'UIV-061': 'WARNING',
        'UIV-062': 'INFO',
        'UIV-063': 'INFO',
        'UIV-070': 'INFO',
        'UIV-080': 'INFO',
        'UIV-081': 'INFO',
        'UIV-013': 'WARNING'
    }


    static classify( { messages, layer } ) {
        const classified = messages
            .map( ( message ) => {
                const { code } = SeverityClassifier.#extractCode( { message } )
                const { severity } = SeverityClassifier.#resolveSeverity( { code, layer } )
                const { location } = SeverityClassifier.#extractLocation( { message, code } )

                return {
                    code,
                    severity,
                    layer,
                    location,
                    message
                }
            } )

        return { classified }
    }


    static classifyAll( { layer1Messages, layer2Messages, layer3Messages, layer4Messages, layer5Messages } ) {
        const allClassified = []

        if( layer1Messages && layer1Messages.length > 0 ) {
            const { classified } = SeverityClassifier.classify( { messages: layer1Messages, layer: 1 } )
            allClassified.push( ...classified )
        }

        if( layer2Messages && layer2Messages.length > 0 ) {
            const { classified } = SeverityClassifier.classify( { messages: layer2Messages, layer: 2 } )
            allClassified.push( ...classified )
        }

        if( layer3Messages && layer3Messages.length > 0 ) {
            const { classified } = SeverityClassifier.classify( { messages: layer3Messages, layer: 3 } )
            allClassified.push( ...classified )
        }

        if( layer4Messages && layer4Messages.length > 0 ) {
            const { classified } = SeverityClassifier.classify( { messages: layer4Messages, layer: 4 } )
            allClassified.push( ...classified )
        }

        if( layer5Messages && layer5Messages.length > 0 ) {
            const { classified } = SeverityClassifier.classify( { messages: layer5Messages, layer: 5 } )
            allClassified.push( ...classified )
        }

        return { classified: allClassified }
    }


    static #extractCode( { message } ) {
        const match = message.match( /^([A-Z]{3,4}-\d{3})/ )
        const code = match ? match[ 1 ] : 'UNK-000'

        return { code }
    }


    static #extractLocation( { message, code } ) {
        const afterCode = message.slice( code.length ).trim()
        const colonIndex = afterCode.indexOf( ':' )

        if( colonIndex <= 0 ) {
            const location = null

            return { location }
        }

        const potentialLocation = afterCode.slice( 0, colonIndex ).trim()
        const hasSpaces = potentialLocation.includes( ' ' )

        if( hasSpaces ) {
            const location = null

            return { location }
        }

        const location = potentialLocation

        return { location }
    }


    static #resolveSeverity( { code, layer } ) {
        const layerMap = SeverityClassifier.#getLayerMap( { layer } )

        if( layerMap && layerMap[ code ] ) {
            const severity = layerMap[ code ]

            return { severity }
        }

        const severity = 'WARNING'

        return { severity }
    }


    static #getLayerMap( { layer } ) {
        const maps = {
            1: SeverityClassifier.#LAYER_1_SEVERITY,
            2: SeverityClassifier.#LAYER_2_SEVERITY,
            3: SeverityClassifier.#LAYER_3_SEVERITY,
            4: SeverityClassifier.#LAYER_4_SEVERITY,
            5: SeverityClassifier.#LAYER_5_SEVERITY
        }

        const map = maps[ layer ] || null

        return { map }[ 'map' ]
    }
}


export { SeverityClassifier }
