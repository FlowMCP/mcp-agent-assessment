import { McpAgentAssessment } from '../../src/index.mjs'


const ENDPOINT = process.argv[ 2 ] || 'https://mcp.x402.org/sse'

const ERC8004_CONFIG = {
    rpcNodes: {
        'BASE_MAINNET': 'https://base-mainnet.g.alchemy.com/v2/YOUR_KEY_HERE'
    }
}

const USE_ERC8004 = process.argv[ 3 ] === '--erc8004'


async function main() {
    console.log( `\n  Assessment for: ${ENDPOINT}` )
    console.log( `  ERC-8004:       ${USE_ERC8004 ? 'enabled' : 'disabled'}\n` )

    const config = {
        endpoint: ENDPOINT,
        timeout: 20000
    }

    if( USE_ERC8004 ) {
        config[ 'erc8004' ] = ERC8004_CONFIG
    }

    const result = await McpAgentAssessment.assess( config )

    console.log( `  Status:  ${result[ 'status' ] ? 'HEALTHY' : 'UNHEALTHY'}` )
    console.log( `  Grade:   ${result[ 'entries' ][ 'assessment' ][ 'grade' ]}` )
    console.log( `  Errors:  ${result[ 'entries' ][ 'assessment' ][ 'errorCount' ]}` )
    console.log( `  Warns:   ${result[ 'entries' ][ 'assessment' ][ 'warningCount' ]}` )
    console.log( `  Info:    ${result[ 'entries' ][ 'assessment' ][ 'infoCount' ]}` )
    console.log( '' )

    console.log( '  --- Categories ---' )
    Object.entries( result[ 'categories' ] )
        .forEach( ( [ key, value ] ) => {
            const icon = value ? '+' : '-'

            console.log( `  [${icon}] ${key}` )
        } )

    console.log( '' )

    if( result[ 'messages' ].length > 0 ) {
        console.log( '  --- Messages ---' )
        result[ 'messages' ]
            .forEach( ( msg ) => {
                const { severity, code, layer, message } = msg

                console.log( `  [L${layer}] ${severity} ${code}: ${message}` )
            } )
        console.log( '' )
    }

    console.log( '  --- MCP Server ---' )
    const { mcp } = result[ 'entries' ]

    if( mcp ) {
        console.log( `  Name:     ${mcp[ 'serverName' ]}` )
        console.log( `  Version:  ${mcp[ 'serverVersion' ]}` )
        console.log( `  Protocol: ${mcp[ 'protocolVersion' ]}` )
        console.log( `  Tools:    ${mcp[ 'toolCount' ]}` )
    }

    console.log( '' )

    if( result[ 'entries' ][ 'a2a' ] ) {
        console.log( '  --- A2A Agent ---' )
        const { a2a } = result[ 'entries' ]

        console.log( `  Name:     ${a2a[ 'agentName' ]}` )
        console.log( `  Version:  ${a2a[ 'agentVersion' ]}` )
        console.log( `  Skills:   ${a2a[ 'skillCount' ]}` )
        console.log( '' )
    }

    if( result[ 'entries' ][ 'erc8004' ] ) {
        console.log( '  --- ERC-8004 ---' )
        const { erc8004 } = result[ 'entries' ]

        console.log( `  AgentId:  ${erc8004[ 'agentId' ]}` )
        console.log( `  Chain:    ${erc8004[ 'chainAlias' ]}` )
        console.log( `  Verified: ${erc8004[ 'isOnChainVerified' ]}` )
        console.log( `  Compliant:${erc8004[ 'isSpecCompliant' ]}` )
        console.log( '' )
    }

    if( result[ 'entries' ][ 'reputation' ] ) {
        console.log( '  --- Reputation ---' )
        const { reputation } = result[ 'entries' ]

        console.log( `  Feedback:    ${reputation[ 'feedbackCount' ]}` )
        console.log( `  Avg Value:   ${reputation[ 'averageValue' ]}` )
        console.log( `  Validations: ${reputation[ 'validationCount' ]}` )
        console.log( '' )
    }

    console.log( '  Done.\n' )
}


main()
