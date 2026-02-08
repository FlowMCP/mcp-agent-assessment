import { McpServerValidator } from 'x402-mcp-validator'
import { A2aAgentValidator } from 'a2a-agent-validator'
import { McpAppsValidator } from 'mcp-apps-validator'


class AssessmentComparator {


    static compare( { before, after } ) {
        const messages = []

        const { integrityMessages } = AssessmentComparator.#checkIntegrity( { before, after } )
        messages.push( ...integrityMessages )

        const { mcpDiff } = AssessmentComparator.#compareMcp( { before, after } )
        const { a2aDiff } = AssessmentComparator.#compareA2a( { before, after } )
        const { uiDiff } = AssessmentComparator.#compareUi( { before, after } )
        const { erc8004Diff } = AssessmentComparator.#compareErc8004( { before, after } )
        const { reputationDiff } = AssessmentComparator.#compareReputation( { before, after } )
        const { assessmentDiff } = AssessmentComparator.#compareAssessment( { before, after } )

        const diff = {
            mcp: mcpDiff,
            a2a: a2aDiff,
            ui: uiDiff,
            erc8004: erc8004Diff,
            reputation: reputationDiff,
            assessment: assessmentDiff
        }

        const { hasChanges } = AssessmentComparator.#detectChanges( { diff } )

        return { status: true, messages, hasChanges, diff }
    }


    static #checkIntegrity( { before, after } ) {
        const integrityMessages = []

        const beforeEndpoint = before[ 'entries' ] && before[ 'entries' ][ 'endpoint' ]
        const afterEndpoint = after[ 'entries' ] && after[ 'entries' ][ 'endpoint' ]

        if( beforeEndpoint && afterEndpoint && beforeEndpoint !== afterEndpoint ) {
            integrityMessages.push( 'CMP-001: Endpoints differ between snapshots' )
        }

        const beforeTimestamp = before[ 'entries' ] && before[ 'entries' ][ 'timestamp' ]
        const afterTimestamp = after[ 'entries' ] && after[ 'entries' ][ 'timestamp' ]

        if( !beforeTimestamp ) {
            integrityMessages.push( 'CMP-002: Before snapshot missing timestamp' )
        }

        if( beforeTimestamp && afterTimestamp && new Date( afterTimestamp ) < new Date( beforeTimestamp ) ) {
            integrityMessages.push( 'CMP-003: After snapshot is older than before snapshot' )
        }

        return { integrityMessages }
    }


    static #compareMcp( { before, after } ) {
        const beforeLayers = before[ 'layers' ]
        const afterLayers = after[ 'layers' ]

        if( !beforeLayers || !afterLayers || !beforeLayers[ 'mcp' ] || !afterLayers[ 'mcp' ] ) {
            const mcpDiff = null

            return { mcpDiff }
        }

        try {
            const { diff } = McpServerValidator.compare( {
                before: beforeLayers[ 'mcp' ],
                after: afterLayers[ 'mcp' ]
            } )

            return { mcpDiff: diff }
        } catch( _e ) {
            return { mcpDiff: null }
        }
    }


    static #compareA2a( { before, after } ) {
        const beforeLayers = before[ 'layers' ]
        const afterLayers = after[ 'layers' ]

        if( !beforeLayers || !afterLayers || !beforeLayers[ 'a2a' ] || !afterLayers[ 'a2a' ] ) {
            const a2aDiff = null

            return { a2aDiff }
        }

        try {
            const { diff } = A2aAgentValidator.compare( {
                before: beforeLayers[ 'a2a' ],
                after: afterLayers[ 'a2a' ]
            } )

            return { a2aDiff: diff }
        } catch( _e ) {
            return { a2aDiff: null }
        }
    }


    static #compareUi( { before, after } ) {
        const beforeLayers = before[ 'layers' ]
        const afterLayers = after[ 'layers' ]

        if( !beforeLayers || !afterLayers || !beforeLayers[ 'ui' ] || !afterLayers[ 'ui' ] ) {
            const uiDiff = null

            return { uiDiff }
        }

        try {
            const { diff } = McpAppsValidator.compare( {
                before: beforeLayers[ 'ui' ],
                after: afterLayers[ 'ui' ]
            } )

            return { uiDiff: diff }
        } catch( _e ) {
            return { uiDiff: null }
        }
    }


    static #compareErc8004( { before, after } ) {
        const beforeErc8004 = before[ 'entries' ] && before[ 'entries' ][ 'erc8004' ]
        const afterErc8004 = after[ 'entries' ] && after[ 'entries' ][ 'erc8004' ]

        if( !beforeErc8004 && !afterErc8004 ) {
            return { erc8004Diff: null }
        }

        const registrationChanged = {}
        const categoriesChanged = {}

        const registrationFields = [
            'agentId', 'agentRegistry', 'chainId', 'chainAlias',
            'registrationName', 'registrationDescription',
            'isOnChainVerified', 'isSpecCompliant',
            'x402Support', 'isActive'
        ]

        registrationFields
            .forEach( ( field ) => {
                const beforeVal = beforeErc8004 ? beforeErc8004[ field ] : null
                const afterVal = afterErc8004 ? afterErc8004[ field ] : null

                if( beforeVal !== afterVal ) {
                    registrationChanged[ field ] = { before: beforeVal, after: afterVal }
                }
            } )

        const erc8004CategoryFields = [
            'hasWellKnownRegistration', 'hasErc8004Registration',
            'isErc8004OnChainVerified', 'isErc8004SpecCompliant'
        ]

        const beforeCategories = before[ 'categories' ] || {}
        const afterCategories = after[ 'categories' ] || {}

        erc8004CategoryFields
            .forEach( ( field ) => {
                const beforeVal = beforeCategories[ field ]
                const afterVal = afterCategories[ field ]

                if( beforeVal !== afterVal ) {
                    categoriesChanged[ field ] = { before: beforeVal, after: afterVal }
                }
            } )

        const erc8004Diff = {
            registration: { changed: registrationChanged },
            categories: { changed: categoriesChanged }
        }

        return { erc8004Diff }
    }


    static #compareReputation( { before, after } ) {
        const beforeRep = before[ 'entries' ] && before[ 'entries' ][ 'reputation' ]
        const afterRep = after[ 'entries' ] && after[ 'entries' ][ 'reputation' ]

        if( !beforeRep && !afterRep ) {
            return { reputationDiff: null }
        }

        const changed = {}
        const repFields = [ 'feedbackCount', 'averageValue', 'valueDecimals', 'validationCount', 'averageResponse' ]

        repFields
            .forEach( ( field ) => {
                const beforeVal = beforeRep ? beforeRep[ field ] : null
                const afterVal = afterRep ? afterRep[ field ] : null

                if( beforeVal !== afterVal ) {
                    changed[ field ] = { before: beforeVal, after: afterVal }
                }
            } )

        return { reputationDiff: { changed } }
    }


    static #compareAssessment( { before, after } ) {
        const beforeAssessment = before[ 'entries' ] && before[ 'entries' ][ 'assessment' ]
        const afterAssessment = after[ 'entries' ] && after[ 'entries' ][ 'assessment' ]

        if( !beforeAssessment || !afterAssessment ) {
            return { assessmentDiff: null }
        }

        const grade = {
            before: beforeAssessment[ 'grade' ],
            after: afterAssessment[ 'grade' ]
        }

        const errorCount = {
            before: beforeAssessment[ 'errorCount' ],
            after: afterAssessment[ 'errorCount' ]
        }

        const warningCount = {
            before: beforeAssessment[ 'warningCount' ],
            after: afterAssessment[ 'warningCount' ]
        }

        const categoriesChanged = {}
        const beforeCategories = before[ 'categories' ] || {}
        const afterCategories = after[ 'categories' ] || {}

        Object.keys( { ...beforeCategories, ...afterCategories } )
            .forEach( ( key ) => {
                if( beforeCategories[ key ] !== afterCategories[ key ] ) {
                    categoriesChanged[ key ] = { before: beforeCategories[ key ], after: afterCategories[ key ] }
                }
            } )

        const assessmentDiff = {
            grade,
            errorCount,
            warningCount,
            categories: { changed: categoriesChanged }
        }

        return { assessmentDiff }
    }


    static #detectChanges( { diff } ) {
        const { mcp, a2a, ui, erc8004, reputation, assessment } = diff

        if( mcp ) {
            const hasMcpChanges = Object.values( mcp )
                .some( ( section ) => {
                    if( !section || typeof section !== 'object' ) {
                        return false
                    }

                    const hasContent = Object.values( section )
                        .some( ( val ) => {
                            if( Array.isArray( val ) ) {
                                return val.length > 0
                            }

                            if( typeof val === 'object' && val !== null ) {
                                return Object.keys( val ).length > 0
                            }

                            return false
                        } )

                    return hasContent
                } )

            if( hasMcpChanges ) {
                return { hasChanges: true }
            }
        }

        if( a2a ) {
            const hasA2aChanges = Object.values( a2a )
                .some( ( section ) => {
                    if( !section || typeof section !== 'object' ) {
                        return false
                    }

                    const hasContent = Object.values( section )
                        .some( ( val ) => {
                            if( Array.isArray( val ) ) {
                                return val.length > 0
                            }

                            if( typeof val === 'object' && val !== null ) {
                                return Object.keys( val ).length > 0
                            }

                            return false
                        } )

                    return hasContent
                } )

            if( hasA2aChanges ) {
                return { hasChanges: true }
            }
        }

        if( ui ) {
            const hasUiChanges = Object.values( ui )
                .some( ( section ) => {
                    if( !section || typeof section !== 'object' ) {
                        return false
                    }

                    const hasContent = Object.values( section )
                        .some( ( val ) => {
                            if( Array.isArray( val ) ) {
                                return val.length > 0
                            }

                            if( typeof val === 'object' && val !== null ) {
                                return Object.keys( val ).length > 0
                            }

                            return false
                        } )

                    return hasContent
                } )

            if( hasUiChanges ) {
                return { hasChanges: true }
            }
        }

        if( erc8004 ) {
            const { registration, categories } = erc8004
            const hasRegChanges = registration && Object.keys( registration[ 'changed' ] || {} ).length > 0
            const hasCatChanges = categories && Object.keys( categories[ 'changed' ] || {} ).length > 0

            if( hasRegChanges || hasCatChanges ) {
                return { hasChanges: true }
            }
        }

        if( reputation ) {
            const hasRepChanges = Object.keys( reputation[ 'changed' ] || {} ).length > 0

            if( hasRepChanges ) {
                return { hasChanges: true }
            }
        }

        if( assessment ) {
            const { grade, errorCount, categories } = assessment
            const gradeChanged = grade && grade[ 'before' ] !== grade[ 'after' ]
            const errorChanged = errorCount && errorCount[ 'before' ] !== errorCount[ 'after' ]
            const catChanged = categories && Object.keys( categories[ 'changed' ] || {} ).length > 0

            if( gradeChanged || errorChanged || catChanged ) {
                return { hasChanges: true }
            }
        }

        return { hasChanges: false }
    }
}


export { AssessmentComparator }
