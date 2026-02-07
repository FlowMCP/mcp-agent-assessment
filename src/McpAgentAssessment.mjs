import { AssessmentComparator } from './task/AssessmentComparator.mjs'
import { AssessmentPipeline } from './task/AssessmentPipeline.mjs'
import { Validation } from './task/Validation.mjs'


class McpAgentAssessment {


    static async assess( { endpoint, timeout = 15000, erc8004 = null } ) {
        const { status: valStatus, messages: valMessages } = Validation.validationAssess( { endpoint, timeout, erc8004 } )
        if( !valStatus ) { Validation.error( { messages: valMessages } ) }

        const { status, messages, categories, entries, layers } = await AssessmentPipeline.run( {
            endpoint,
            timeout,
            erc8004
        } )

        return { status, messages, categories, entries, layers }
    }


    static compare( { before, after } ) {
        const { status: valStatus, messages: valMessages } = Validation.validationCompare( { before, after } )
        if( !valStatus ) { Validation.error( { messages: valMessages } ) }

        const { status, messages, hasChanges, diff } = AssessmentComparator.compare( { before, after } )

        return { status, messages, hasChanges, diff }
    }
}


export { McpAgentAssessment }
