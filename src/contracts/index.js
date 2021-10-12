import _ERC20 from './abi/ERC20.json'

// Nulls
import _NullsEggManager from './abi/NullsEggManager.json'
import _NullsEggToken from './abi/NullsEggToken.json'
import _NullsRankManager from './abi/NullsRankManager.json'
import _NullsWorldCore from './abi/NullsWorldCore.json'
import _NullsPetToken from './abi/NullsPetToken.json'


const contractAbiWithAddress = (name) => {
    return { address: CONTRACT_ADDRESS[name], ...contractJson(name) }
}


export const contractJson = (name) => {
    return CONTRACTS[`_${name}`]
}


export const CONTRACTS = {
    _ERC20,
    _NullsEggManager,
    _NullsEggToken,
    _NullsRankManager,
    _NullsWorldCore,
    _NullsPetToken
}

export const CONTRACT_ADDRESS = {
    NullsEggManager: '0x78167ba6D8BaAA3e9999177fCa5f08770EE37308',
    NullsEggToken: '0x808034B5c22ED18Efc9325B2729181E4fC2330fB',
    NullsRankManager: '0xC0476862eBcB69554f53772275c935eD561265E9',
    NullsWorldCore: '0xA24272fD064A7ebca12f815094E8307A42AcE5b1',
    NullsPetToken: '0x1D9de135887Fb6f53517Ac76Bd6c1E67121045fb',
    TransferProxy: '0x3Cc1Ad4766c8b4D8a21B233Bae4Ef55c30139Ebd'
}

export const ERC20_ADDRESS = {
    USDT: '0x04F535663110A392A6504839BEeD34E019FdB4E0',
    'T-NET': '0x6aA7CF4F83c6a88cABD93b40D47E7144311882B8'
}

export const getContractAddress = (contract) => {
    return CONTRACT_ADDRESS[contract]
}

export const getERC20ContractAddress = (contract) => {
    return ERC20_ADDRESS[contract]
}

export const NullsEggManager = contractAbiWithAddress('NullsEggManager')
export const NullsEggToken = contractAbiWithAddress('NullsEggToken')
export const NullsRankManager = contractAbiWithAddress('NullsRankManager')
export const NullsWorldCore = contractAbiWithAddress('NullsWorldCore')
export const NullsPetToken = contractAbiWithAddress('NullsPetToken')


// ERC20
export const ERC20 = {
    /** Get ERC20 token contract address with token symbol */
    getAddress(symbol) {
        return ERC20_ADDRESS[symbol]
    },
    ..._ERC20
}
