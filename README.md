## Cream Protocol usage

a) deploy JCream contract and initialize it ((address _adminTools, address _feesCollector, address _tranchesDepl,
            address _compTokenAddress, address _comptrollAddress, address _rewardsToken)

b) call setCEtherContract(address payable _crEtherContract) (crETH address) and setCTokenContract(address _erc20Contract, address _crErc20Contract), i.e. DAI and crDAI address, or 0x0(ethers) and crETH address, and so on.

    UniTroller: 0xFcc044535b84242F5450595b248e8042fa827ffE
    index 0: crETH: 0x6885CC84e759D78F63BFBB480fe9E5122a177035
    index 1: crUSDC: 0xc5b2327e4084b587ebd751be4462ac24fce3a904

    setCEtherContract on Kovan: 0x6885CC84e759D78F63BFBB480fe9E5122a177035

    setCTokenContract on Kovan(USDC): "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede","0xc5b2327e4084b587ebd751be4462ac24fce3a904"

c) set JCream address in jTranchesDeployer contract

d) call addTrancheToProtocol(address _erc20Contract, string memory _nameA, string memory _symbolA, 
            string memory _nameB, string memory _symbolB, uint256 _fixedRpb, uint8 _crTokenDec, uint8 _underlyingDec) to set a new tranche set

    add eth tranche "0x0000000000000000000000000000000000000000","eta","ETA","etb","ETB","40000000000000000","8","18" ---> Please read note here below
    
    add USDC tranche "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede","ucta","UCTA","uctb","UCTB","30000000000000","8","6"

e) remember to enable every tranche deposit with setTrancheDeposit(uint256 _trancheNum, bool _enable) function

Users can now call buy and redeem functions for tranche A & B tokens

Note: if ETH tranche is deployed, please deploy ETHGateway contract without a proxy, then set its address in JCream with setETHGateway function.


## Uniswap contracts
### !!! Please note: we have to use 2 different versions of library for tests and for deploy on mainnet / testnet !!!

This is due to different init code hash for UniswapV2Library file when compiled with other solidity compiler versions.

    - hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash original, remember to restore it before deploying and recompile all files

    - hex'555c8bf3a68dcde924051e2b2db6a6bbce50f756cacad88fdfcaab07ec40b7d9' // i.e. init code hash for tests

Please launch !!AAAuniswapInitHashCode.test.js to get your init code hash in test environment


### Uniswap Tests on Kovan

Uniswap factory on kovan: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f - Uniswap Router02 on kovan: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D

you can test whatever pair you like that is already been deployed by uniswap factory!

## TBD

- does Cream distributes rewards (like compound in COMP tokens)?

- more test has to be done on mainnet?

## Contracts Size (main contracts, no interfaces, no test contracts)
Limit is 24 KiB for single contract
<table>
    <thead>
      <tr>
        <th>Contract</th>
        <th>Size</th>
      </tr>
    </thead>
    <tbody>
        <tr>
            <td>ETHGateway</td>
            <td><code>2.94 KiB</code></td>
        </tr>
        <tr>
            <td>JAdminTools</td>
            <td><code>2.96 KiB</code></td>
        </tr>
        <tr>
            <td>JAdminToolsStorage</td>
            <td><code>0.87 KiB</code></td>
        </tr>
        <tr>
            <td>JCream</td>
            <td><code>22.38 KiB</code></td>
        </tr>
        <tr>
            <td>JCreamStorage</td>
            <td><code>1.71 KiB</code></td>
        </tr>
        <tr>
            <td>JFeesCollector</td>
            <td><code>10.40 KiB</code></td>
        </tr>
        <tr>
            <td>JFeesCollectorStorage</td>
            <td><code>0.96 KiB</code></td>
        </tr>
        <tr>
            <td>JTrancheAToken</td>
            <td><code>10.18 KiB</code></td>
        </tr>
        <tr>
            <td>JTrancheATokenStorage</td>
            <td><code>0.44 KiB</code></td>
        </tr>
        <tr>
            <td>JTrancheBToken</td>
            <td><code>10.18 KiB</code></td>
        </tr>
        <tr>
            <td>JTrancheBTokenStorage</td>
            <td><code>0.44 KiB</code></td>
        </tr>
        <tr>
            <td>JTranchesDeployer</td>
            <td><code>23.70 KiB</code></td>
        </tr>
        <tr>
            <td>JTranchesDeployerStorage</td>
            <td><code>0.14 KiB</code></td>
        </tr>
    </tbody>
  </table>
