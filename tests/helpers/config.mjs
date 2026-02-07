const TEST_ENDPOINT = 'https://mcp.example.com/sse'
const TEST_ORIGIN = 'https://mcp.example.com'
const TEST_TIMEOUT = 15000

const TEST_RPC_NODES = {
    'ETHEREUM_MAINNET': 'https://eth-mainnet.g.alchemy.com/v2/test-key',
    'BASE_MAINNET': 'https://base-mainnet.g.alchemy.com/v2/test-key'
}

const TEST_ERC8004_CONFIG = {
    rpcNodes: TEST_RPC_NODES
}


export {
    TEST_ENDPOINT,
    TEST_ORIGIN,
    TEST_TIMEOUT,
    TEST_RPC_NODES,
    TEST_ERC8004_CONFIG
}
