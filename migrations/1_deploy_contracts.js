require('dotenv').config();
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

var myERC20 = artifacts.require("./mocks/myERC20.sol");
var mySlice = artifacts.require("./mocks/mySlice.sol");
var CErc20 = artifacts.require('./mocks/CErc20.sol');
var CEther = artifacts.require('./mocks/CEther.sol');

var JAdminTools = artifacts.require("./JAdminTools.sol");
var JFeesCollector = artifacts.require("./JFeesCollector.sol");
var JCream = artifacts.require('./JCream');
var JTranchesDeployer = artifacts.require('./JTranchesDeployer');
var IncentivesController = artifacts.require('./IncentivesController');

var JTrancheAToken = artifacts.require('./JTrancheAToken');
var JTrancheBToken = artifacts.require('./JTrancheBToken');

var EthGateway = artifacts.require('./ETHGateway');

const MYERC20_TOKEN_SUPPLY = 5000000;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";
const CREAM_ADDRESS = "0x2ba592F78dB6436527729929AAf6c908497cB200";

const crTROLLER_ADDRESS = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
const cyTROLLER_ADDRESS = "0xAB1c342C7bf5Ec5F02ADEA1c2270670bCa144CbB";
const crETH_ADDRESS = '0xD06527D5e56A3495252A528C4987003b712860eE'
const cyWETH_ADDRESS = '0x41c84c0e2EE0b740Cf0d31F63f3B6F627DC6b393'
const crDAI_ADDRESS = '0x92b767185fb3b04f881e3ac8e5b0662a027a1d9f'
const cyDAI_ADDRESS = '0x8e595470Ed749b85C6F7669de83EAe304C2ec68F'

module.exports = async (deployer, network, accounts) => {
  if (network == "development") {
    const tokenOwner = accounts[0];

    // local tests
    // const myDAIinstance = await deployProxy(myERC20, [MYERC20_TOKEN_SUPPLY], { from: tokenOwner });
    // console.log('myDAI Deployed: ', myDAIinstance.address);
    // const mycEthinstance = await deployProxy(CEther, [], { from: tokenOwner });
    // console.log('myCEth Deployed: ', mycEthinstance.address);
    // const mycDaiinstance = await deployProxy(CErc20, [], { from: tokenOwner });
    // console.log('myCErc20 Deployed: ', mycDaiinstance.address);

    const factoryOwner = accounts[0];
    const JATinstance = await deployProxy(JAdminTools, [], { from: factoryOwner });
    console.log('JAdminTools Deployed: ', JATinstance.address);

    const JFCinstance = await deployProxy(JFeesCollector, [JATinstance.address], { from: factoryOwner });
    console.log('JFeesCollector Deployed: ', JFCinstance.address);

    const JTDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner });
    console.log("Tranches Deployer: " + JTDeployer.address);

    const JCinstance = await deployProxy(JCream, [JATinstance.address, JFCinstance.address, JTDeployer.address, CREAM_ADDRESS, crTROLLER_ADDRESS], { from: factoryOwner });
    console.log('JCream Deployed: ', JCinstance.address);

    await JATinstance.addAdmin(JCinstance.address, { from: factoryOwner })

    await deployer.deploy(EthGateway, crETH_ADDRESS, JCinstance.address);
    const JEGinstance = await EthGateway.deployed();
    console.log('ETHGateway Deployed: ', JEGinstance.address);

    await JTDeployer.setJCreamAddress(JCinstance.address, { from: factoryOwner });

    await JCinstance.setETHGateway(JEGinstance.address, { from: factoryOwner });

    // local tests
    // await JCinstance.setCrEtherContract(mycEthinstance.address, { from: factoryOwner });
    // await JCinstance.setCrTokenContract(myDAIinstance.address, mycDaiinstance.address, { from: factoryOwner });
    // mainnet fork
    await JCinstance.setCrEtherContract(crETH_ADDRESS, { from: factoryOwner });
    await JCinstance.setCrTokenContract(DAI_ADDRESS, crDAI_ADDRESS, { from: factoryOwner });

    await JCinstance.addTrancheToProtocol(ZERO_ADDRESS, "jEthTrancheAToken", "JEA", "jEthTrancheBToken", "JEB", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });
    trParams = await JCinstance.trancheAddresses(0);
    let EthTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("ETH Tranche A Token Address: " + EthTrA.address);
    let EthTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("ETH Tranche B Token Address: " + EthTrB.address);

    await JCinstance.setTrancheDeposit(0, true, { from: factoryOwner });

    // local tests
    // await JCinstance.addTrancheToProtocol(myDAIinstance.address, "jDaiTrancheAToken", "JDA", "jDaiTrancheBToken", "JDB", web3.utils.toWei("0.02", "ether"), 18, 18, { from: factoryOwner });
    // mainnet fork
    await JCinstance.addTrancheToProtocol(DAI_ADDRESS, "jDaiTrancheAToken", "JDA", "jDaiTrancheBToken", "JDB", web3.utils.toWei("0.02", "ether"), 8, 18, { from: factoryOwner });
    trParams = await JCinstance.trancheAddresses(1);
    let DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("DAI Tranche A Token Address: " + DaiTrA.address);
    let DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("DAI Tranche B Token Address: " + DaiTrB.address);

    await JCinstance.setTrancheDeposit(1, true, { from: factoryOwner });

    const JIController = await deployProxy(IncentivesController, [], { from: factoryOwner });
    console.log("Incentive controller mock: " + JIController.address);

    await JCinstance.setincentivesControllerAddress(JIController.address);

  } else if (network == "kovan") {
    let { 
      IS_UPGRADE, TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS, TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS, FEE_COLLECTOR_ADDRESS
    } = process.env;
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];
    if (IS_UPGRADE == 'true') {
      console.log('contracts are being upgraded');
      const JFCinstance = await upgradeProxy(FEE_COLLECTOR_ADDRESS, JFeesCollector, { from: factoryOwner });
      console.log(`FEE_COLLECTOR_ADDRESS=${JFCinstance.address}`)
    } else {
      // deployed new contract
      try {
        const JATinstance = await deployProxy(JAdminTools, [], { from: factoryOwner });
        console.log('JAdminTools Deployed: ', JATinstance.address);

        const JFCinstance = await deployProxy(JFeesCollector, [JATinstance.address], { from: factoryOwner });
        console.log('JFeesCollector Deployed: ', JFCinstance.address);

        const compoundDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner, unsafeAllowCustomTypes: true });
        console.log(`COMPOUND_DEPLOYER=${compoundDeployer.address}`);

        // Source: https://github.com/compound-finance/compound-config/blob/master/networks/kovan.json
        const JCompoundInstance = await deployProxy(JCream, [JATinstance.address, JFCinstance.address, compoundDeployer.address, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS],
          { from: factoryOwner });

        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
        compoundDeployer.setJCompoundAddress(JCompoundInstance.address);
        console.log('compound deployer 1');

        await JCompoundInstance.setCrTokenContract(TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS, { from: factoryOwner });
        console.log('compound deployer 2');

        await JCompoundInstance.setCrTokenContract(TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, { from: factoryOwner });

        console.log('compound deployer 3');
        await JCompoundInstance.addTrancheToProtocol(TRANCHE_ONE_TOKEN_ADDRESS, "Tranche A - Compound DAI", "ACDAI", "Tranche B - Compound DAI", "BCDAI", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });

        console.log('compound deployer 4');
        //await JCompoundInstance.addTrancheToProtocol(ZERO_ADDRESS, "Tranche A - Compound ETH", "ACETH", "Tranche B - Compound ETH", "BCETH", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });
        // await JCompoundInstance.addTrancheToProtocol("0xb7a4f3e9097c08da09517b5ab877f7a917224ede", "Tranche A - Compound USDC", "ACUSDC", "Tranche B - Compound USDC", "BCUSDC", web3.utils.toWei("0.02", "ether"), 8, 6, { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol(TRANCHE_TWO_TOKEN_ADDRESS, "Tranche A - Compound USDT", "ACUSDT", "Tranche B - Compound USDT", "BCUSDT", web3.utils.toWei("0.02", "ether"), 8, 6, { from: factoryOwner });

        trParams = await JCompoundInstance.trancheAddresses(0);
        let DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
        let DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
        trParams = await JCompoundInstance.trancheAddresses(1);
        let USDTTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
        let USDTTrB = await JTrancheBToken.at(trParams.BTrancheAddress);

        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
        console.log(`REACT_APP_COMP_TRANCHE_TOKENS=${DaiTrA.address},${DaiTrB.address},${USDTTrA.address},${USDTTrB.address}`)
      } catch (error) {
        console.log(error);
      }
    }
  } else if (network == "mainnet") {
    let { 
      IS_UPGRADE, TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS, TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS, FEE_COLLECTOR_ADDRESS
    } = process.env;
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];
    if (IS_UPGRADE == 'true') {
      console.log('contracts are being upgraded');
      const JFCinstance = await upgradeProxy(FEE_COLLECTOR_ADDRESS, JFeesCollector, { from: factoryOwner });
      console.log(`FEE_COLLECTOR_ADDRESS=${JFCinstance.address}`)
    } else {
      try {
        const JATinstance = await deployProxy(JAdminTools, [], { from: factoryOwner });
        console.log('JAdminTools Deployed: ', JATinstance.address);

        const JFCinstance = await deployProxy(JFeesCollector, [JATinstance.address], { from: factoryOwner });
        console.log('JFeesCollector Deployed: ', JFCinstance.address);

        const compoundDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner, unsafeAllowCustomTypes: true });
        console.log(`COMPOUND_DEPLOYER=${compoundDeployer.address}`);

        const JCompoundInstance = await deployProxy(JCream, [JATinstance.address, JFCinstance.address, compoundDeployer.address, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS],
          { from: factoryOwner });

        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
        compoundDeployer.setJCompoundAddress(JCompoundInstance.address);
        console.log('compound deployer 1');

        await JCompoundInstance.setCrTokenContract(TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS, { from: factoryOwner });
        console.log('compound deployer 2');

        await JCompoundInstance.setCrTokenContract(TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, { from: factoryOwner });

        console.log('compound deployer 3');
        await JCompoundInstance.addTrancheToProtocol(TRANCHE_ONE_TOKEN_ADDRESS, "Tranche A - Compound DAI", "ACDAI", "Tranche B - Compound DAI", "BCDAI", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });

        console.log('compound deployer 4');
        await JCompoundInstance.addTrancheToProtocol(TRANCHE_TWO_TOKEN_ADDRESS, "Tranche A - Compound USDC", "ACUSDC", "Tranche B - Compound USDC", "BCUSDC", web3.utils.toWei("0.02", "ether"), 8, 6, { from: factoryOwner });

        trParams = await JCompoundInstance.trancheAddresses(0);
        let DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
        let DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
        trParams = await JCompoundInstance.trancheAddresses(1);
        let USDCTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
        let USDCTrB = await JTrancheBToken.at(trParams.BTrancheAddress);

        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
        console.log(`REACT_APP_COMP_TRANCHE_TOKENS=${DaiTrA.address},${DaiTrB.address},${USDCTrA.address},${USDCTrB.address}`)
      } catch (error) {
        console.log(error);
      }
    }
  }
}