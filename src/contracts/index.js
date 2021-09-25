import _ERC20 from './abi/ERC20.json'

// Nulls
import _NullsEggManager from './abi/NullsEggManager.json'
import _NullsEggToken from './abi/NullsEggToken.json'
import _RingManager from './abi/RingManager.json'
import _NullsWorldCore from './abi/NullsWorldCore.json'
import _NullsPetToken from './abi/NullsPetToken.json'
import _NullsWorldMarket from './abi/NullsWorldMarket.json'


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
    _RingManager,
    _NullsWorldCore,
    _NullsPetToken,
    _NullsWorldMarket
}

export const CONTRACT_ADDRESS = {
    Router: '0x54065295d6f42e945A0E46D230DE88A1f55fBd0F',
    Storage: '0xf21B139797Bb5b703C18df6603864096091D2535',
    NullsEggToken: '0x21782523b5C6b7Cd00A284351af9C3C4cfDecB1e',
    NullsWorldCore: '0x23B08841ceE1f55e92A3e0F46c045740EbE46D2d',
    NullsEggManager: '0x2Eeba75b34376e314756eDea782657E79272fa3E',
    RingManager: '0x8dfe673f166cCF27B9BfE05B79803Cf8b05DF2D9',
    NullsPetToken: '0x6c8740fd77692FBce3c9A9813B8F9bBC89aaC928',
    NullsWorldMarket: '0xF21432E33C6BB6AF1730063f2c963eb5Ca5926D7'
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
export const RingManager = contractAbiWithAddress('RingManager')
export const NullsWorldCore = contractAbiWithAddress('NullsWorldCore')
export const NullsPetToken = contractAbiWithAddress('NullsPetToken')
export const NullsWorldMarket = contractAbiWithAddress('NullsWorldMarket')


// ERC20
export const ERC20 = {
    /** Get ERC20 token contract address with token symbol */
    getAddress(symbol) {
        return ERC20_ADDRESS[symbol]
    },
    ..._ERC20
}
