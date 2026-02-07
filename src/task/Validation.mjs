class Validation {


    static validationAssess( { endpoint, timeout, erc8004 } ) {
        const struct = { status: false, messages: [] }

        if( endpoint === undefined ) {
            struct[ 'messages' ].push( 'ASM-001 endpoint: Missing value' )
        } else if( typeof endpoint !== 'string' ) {
            struct[ 'messages' ].push( 'ASM-002 endpoint: Must be a string' )
        } else if( endpoint.trim() === '' ) {
            struct[ 'messages' ].push( 'ASM-003 endpoint: Must not be empty' )
        } else {
            try {
                new URL( endpoint )
            } catch( _e ) {
                struct[ 'messages' ].push( 'ASM-004 endpoint: Must be a valid URL' )
            }
        }

        if( timeout !== undefined ) {
            if( typeof timeout !== 'number' ) {
                struct[ 'messages' ].push( 'ASM-005 timeout: Must be a number' )
            } else if( timeout <= 0 ) {
                struct[ 'messages' ].push( 'ASM-006 timeout: Must be greater than 0' )
            }
        }

        if( erc8004 !== undefined && erc8004 !== null ) {
            if( typeof erc8004 !== 'object' || Array.isArray( erc8004 ) ) {
                struct[ 'messages' ].push( 'ASM-010 erc8004: Must be an object' )
            } else if( erc8004[ 'rpcNodes' ] === undefined ) {
                struct[ 'messages' ].push( 'ASM-011 erc8004.rpcNodes: Missing value' )
            } else if( typeof erc8004[ 'rpcNodes' ] !== 'object' || Array.isArray( erc8004[ 'rpcNodes' ] ) ) {
                struct[ 'messages' ].push( 'ASM-012 erc8004.rpcNodes: Must be an object' )
            } else {
                const rpcEntries = Object.entries( erc8004[ 'rpcNodes' ] )

                if( rpcEntries.length === 0 ) {
                    struct[ 'messages' ].push( 'ASM-013 erc8004.rpcNodes: Must have at least one entry' )
                } else {
                    rpcEntries
                        .forEach( ( [ alias, url ] ) => {
                            if( typeof alias !== 'string' || alias.trim() === '' ) {
                                struct[ 'messages' ].push( `ASM-014 erc8004.rpcNodes: Key "${alias}" must be a non-empty string` )
                            }

                            if( typeof url !== 'string' || url.trim() === '' ) {
                                struct[ 'messages' ].push( `ASM-015 erc8004.rpcNodes.${alias}: Value must be a non-empty string` )
                            } else {
                                try {
                                    new URL( url )
                                } catch( _e ) {
                                    struct[ 'messages' ].push( `ASM-016 erc8004.rpcNodes.${alias}: Must be a valid URL` )
                                }
                            }
                        } )
                }
            }
        }

        if( struct[ 'messages' ].length > 0 ) {
            return struct
        }

        struct[ 'status' ] = true

        return struct
    }


    static validationCompare( { before, after } ) {
        const struct = { status: false, messages: [] }

        if( before === undefined ) {
            struct[ 'messages' ].push( 'ASM-020 before: Missing value' )
        } else if( before === null || typeof before !== 'object' || Array.isArray( before ) ) {
            struct[ 'messages' ].push( 'ASM-021 before: Must be an object' )
        } else if( !before[ 'categories' ] || !before[ 'entries' ] ) {
            struct[ 'messages' ].push( 'ASM-022 before: Missing categories or entries' )
        }

        if( after === undefined ) {
            struct[ 'messages' ].push( 'ASM-023 after: Missing value' )
        } else if( after === null || typeof after !== 'object' || Array.isArray( after ) ) {
            struct[ 'messages' ].push( 'ASM-024 after: Must be an object' )
        } else if( !after[ 'categories' ] || !after[ 'entries' ] ) {
            struct[ 'messages' ].push( 'ASM-025 after: Missing categories or entries' )
        }

        if( struct[ 'messages' ].length > 0 ) {
            return struct
        }

        struct[ 'status' ] = true

        return struct
    }


    static error( { messages } ) {
        const messageStr = messages.join( ', ' )

        throw new Error( messageStr )
    }
}


export { Validation }
