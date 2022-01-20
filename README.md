# Cream Tranche Protocol

<img src="https://gblobscdn.gitbook.com/spaces%2F-MP969WsfbfQJJFgxp2K%2Favatar-1617981494187.png?alt=media" alt="Tranche Logo" width="100">

Cream Tranche is a decentralized protocol for managing risk and maximizing returns. The protocol integrates with Cream's crTokens, to create two new interest-bearing instruments, one with a fixed-rate, Tranche A, and one with a variable rate, Tranche B. 

Info URL: https://docs.tranche.finance/tranchefinance/


## Development

### Install Dependencies

```bash
npm i
```

### Compile project

```bash
truffle compile --all
```

### Run test

```bash
truffle run test
```

### Code Coverage

```bash
truffle run coverage
```

or to test a single file:

```bash
truffle run coverage --network development --file="test/JCTruffle.test.js"    
```

Test coverage on JCream contract: 93.61%


[(Back to top)](#Cream-Tranche-Protocol)


## Cream Protocol usage

a) deploy JCream contract and initialize it ((address _adminTools, address _feesCollector, address _tranchesDepl,
            address _compTokenAddress, address _comptrollAddress, address _rewardsToken)

b) call setCEtherContract(address payable _crEtherContract) (crETH address) and setCTokenContract(address _erc20Contract, address _crErc20Contract), i.e. DAI and crDAI address, or 0x0(ethers) and crETH address, and so on. Following examples on Kovan:

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

[(Back to top)](#Cream-Tranche-Protocol)

## TBD

- does Cream distributes rewards (like compound in COMP tokens)?

- more test has to be done on mainnet?

[(Back to top)](#Cream-Tranche-Protocol)

## Main contracts - Name, Size and Description

<table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Size (KiB)</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
        <tr>
            <td>ETHGateway</td>
            <td><code>3.21</code></td>
            <td>Ethereum gateway, useful when dealing with ethers</td>
        </tr>
        <tr>
            <td>JAdminTools</td>
            <td><code>2.27</code></td>
            <td>Contract for administrative roles control (implementation), allowing the identification of addresses when dealing with reserved methods.</td>
        </tr>
        <tr>
            <td>JAdminToolsStorage</td>
            <td><code>0.72</code></td>
            <td>Contract for administrative roles control (storage)</td>
        </tr>
        <tr>
            <td>JCream</td>
            <td><code>21.57</code></td>
            <td>Core contract protocol (implementation). It is responsible to make all actions to give the exact amount of tranche token to users, connecting with Cream to have interest rates and other informations to give tokens the price they should have block by block. It claims extra token from Cream (if any), sending them to Fees collector contract, that changes all fees and extra tokens into new interests for token holders. It deploys new tranche tokens via Tranche Deployer contract.</td>
        </tr>
        <tr>
            <td>JCreamStorage</td>
            <td><code>1.85</code></td>
            <td>Core contract protocol (storage)</td>
        </tr>
        <tr>
            <td>JFeesCollector</td>
            <td><code>9.28</code></td>
            <td>Fees collector and uniswap swapper (implementation), it changes all fees and extra tokens into new interests for token holders, sending back extra amount to Cream protocol contract</td>
        </tr>
        <tr>
            <td>JFeesCollectorStorage</td>
            <td><code>0.82</code></td>
            <td>Fees collector and uniswap swapper (storage)</td>
        </tr>
        <tr>
            <td>JTrancheAToken</td>
            <td><code>6.83</code></td>
            <td>Tranche A token (implementation), with a non decreasing price, making possible for holders to have a fixed interest percentage.</td>
        </tr>
        <tr>
            <td>JTrancheBToken</td>
            <td><code>6.83</code></td>
            <td>Tranche B token (implementation), with a floating price, making possible for holders to have a variable interest percentage.</td>
        </tr>
        <tr>
            <td>JTranchesDeployer</td>
            <td><code>17.77</code></td>
            <td>Tranche A & B token deployer (implementation): this contract deploys tranche tokens everytime a new tranche is opened by the core protocol contract</td>
        </tr>
        <tr>
            <td>JTranchesDeployerStorage</td>
            <td><code>0.14</code></td>
            <td>Tranche A & B token deployer (storage)</td>
        </tr>
    </tbody>
  </table>

[(Back to top)](#Cream-Tranche-Protocol)