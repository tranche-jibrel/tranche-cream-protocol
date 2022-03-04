const {
  deployProxy,
  upgradeProxy
} = require('@openzeppelin/truffle-upgrades');
const {
  expect
} = require('chai');

const timeMachine = require('ganache-time-traveler');

const Web3 = require('web3');
// Ganache UI on 8545
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const {
  BN,
  constants,
  expectEvent,
  expectRevert,
  time
} = require('@openzeppelin/test-helpers');

const JAdminTools = artifacts.require('JAdminTools');
const JFeesCollector = artifacts.require('JFeesCollector');

const JCream = artifacts.require('JCream');
const JTranchesDeployer = artifacts.require('JTranchesDeployer');

const JTrancheAToken = artifacts.require('JTrancheAToken');
const JTrancheBToken = artifacts.require('JTrancheBToken');

const EthGateway = artifacts.require('./ETHGateway');

const {ZERO_ADDRESS} = constants;

const fromWei = (x) => web3.utils.fromWei(x.toString());
const toWei = (x) => web3.utils.toWei(x.toString());
const fromWei8Dec = (x) => x / Math.pow(10, 8);
const toWei8Dec = (x) => x * Math.pow(10, 8);

const crETH_ADDRESS = '0xD06527D5e56A3495252A528C4987003b712860eE'

let jFCContract, jATContract, jTrDeplContract, jCreamContract;
let ethTrAContract, ethTrBContract, daiTrAContract, daiTrBContract;
let tokenOwner, user1;

contract("JCream crEth mainnet", function (accounts) {

  it("ETH balances", async function () {
    //accounts = await web3.eth.getAccounts();
    tokenOwner = accounts[0];
    user1 = accounts[1];
    console.log(tokenOwner);
    console.log(await web3.eth.getBalance(tokenOwner));
    console.log(await web3.eth.getBalance(user1));
  });

  it("All other contracts ok", async function () {
    jFCContract = await JFeesCollector.deployed();
    expect(jFCContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jFCContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jFCContract.address);

    jATContract = await JAdminTools.deployed();
    expect(jATContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jATContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jATContract.address);

    jTrDeplContract = await JTranchesDeployer.deployed();
    expect(jTrDeplContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jTrDeplContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jTrDeplContract.address);

    jCreamContract = await JCream.deployed();
    expect(jCreamContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jCreamContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jCreamContract.address);

    trParams0 = await jCreamContract.trancheAddresses(0);
    ethTrAContract = await JTrancheAToken.at(trParams0.ATrancheAddress);
    expect(ethTrAContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(ethTrAContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(ethTrAContract.address);

    ethTrBContract = await JTrancheBToken.at(trParams0.BTrancheAddress);
    expect(ethTrBContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(ethTrBContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(ethTrBContract.address);

    trParams1 = await jCreamContract.trancheAddresses(1);
    daiTrAContract = await JTrancheAToken.at(trParams1.ATrancheAddress);
    expect(daiTrAContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(daiTrAContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(daiTrAContract.address);

    daiTrBContract = await JTrancheBToken.at(trParams1.BTrancheAddress);
    expect(daiTrBContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(daiTrBContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(daiTrBContract.address);
  });

  it("ETH Gateway", async function () {
    ethGatewayContract = await EthGateway.deployed();
    expect(ethGatewayContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(ethGatewayContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(ethGatewayContract.address);
  });

  it("user1 buys some token EthTrA", async function () {
    console.log(user1);
    console.log("User1 Eth balance: " + fromWei(await web3.eth.getBalance(user1)) + " ETH");
    console.log((await jCreamContract.getCreamPrice(0)).toString());
    trPar = await jCreamContract.trancheParameters(0);
    console.log("param tranche A: " + JSON.stringify(trPar, ["trancheAFixedPercentage", "trancheALastActionTime", "storedTrancheAPrice", "trancheACurrentRPS", "crTokenDecimals", "underlyingDecimals"]));
    tx = await jCreamContract.calcRPBFromPercentage(0, {
      from: user1
    });
    console.log("rps tranche A: " + await jCreamContract.getTrancheACurrentRPS(0));
    trAPrice = await jCreamContract.getTrancheAExchangeRate(0, {
      from: user1
    });
    console.log("price tranche A: " + fromWei(trAPrice));

    tx = await jCreamContract.buyTrancheAToken(0, toWei("1"), {
      from: user1,
      value: toWei("1")
    });
    console.log("User1 New Eth balance: " + fromWei(await web3.eth.getBalance(user1)) + " ETH");
    console.log("User1 trA tokens: " + fromWei(await ethTrAContract.balanceOf(user1)) + " ETA");
    console.log("JCream crEth balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crETH_ADDRESS)) + " crEth");
    console.log("TrA price: " + fromWei(await jCreamContract.getTrancheAExchangeRate(0)));
    console.log("Cream Price: " + await jCreamContract.getCreamPrice(0));
    console.log("TrA price: " + fromWei(await jCreamContract.getTrancheAExchangeRate(0)));
  });

  it("user1 buys some token EthTrB", async function () {
    //console.log("User1 Eth balance: "+ fromWei(await web3.eth.getBalance(user1)) + " ETH");
    tx = await jCreamContract.buyTrancheBToken(0, toWei("1"), {
      from: user1,
      value: toWei("1")
    });
    console.log("User1 New Eth balance: " + fromWei(await web3.eth.getBalance(user1)) + " ETH");
    console.log("User1 trB tokens: " + fromWei(await ethTrBContract.balanceOf(user1)) + " ETB");
    console.log("JCream cEth balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crETH_ADDRESS)) + " crEth");
    console.log("TrB price: " + fromWei(await jCreamContract.getTrancheBExchangeRate(0)));
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlockNumber();
    console.log("Actual Block: " + block);
    for (i = 0; i < 100; i++) {
        await timeMachine.advanceBlock()
    }
    console.log("New Actual Block: " + await web3.eth.getBlockNumber())
  });

  it("user1 redeems token EthTrA", async function () {
    oldBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 Eth balance: " + oldBal + " ETH");
    bal = await ethTrAContract.balanceOf(user1);
    console.log("User1 trA tokens: " + fromWei(bal) + " ETA");
    console.log("JCream cEth balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crETH_ADDRESS)) + " crEth");
    console.log("CEther eth bal:" + fromWei(await web3.eth.getBalance(crETH_ADDRESS)));
    trPar = await jCreamContract.trancheParameters(0);
    stPrice = trPar.storedTrancheAPrice * Math.pow(10, -18);
    //console.log(stPrice.toString());
    tempAmnt = bal * Math.pow(10, -18);
    //console.log(tempAmnt.toString())
    taAmount = tempAmnt * stPrice;
    console.log(taAmount);
    tx = await ethTrAContract.approve(jCreamContract.address, bal, {
      from: user1
    });

    tx = await jCreamContract.redeemTrancheAToken(0, bal, {
      from: user1
    });
    newBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trA interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trA tokens: " + fromWei(await ethTrAContract.balanceOf(user1)) + " ETA");
    console.log("JCream new cEth balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crETH_ADDRESS)) + " crEth");
    console.log("TrA price: " + fromWei(await jCreamContract.getTrancheAExchangeRate(0)));
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlockNumber();
    console.log("Actual Block: " + block);
    for (i = 0; i < 100; i++) {
        await timeMachine.advanceBlock()
    }
    console.log("New Actual Block: " + await web3.eth.getBlockNumber())
  });

  it("user1 redeems token EthTrB", async function () {
    oldBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 Eth balance: " + oldBal + " ETH");
    bal = await ethTrBContract.balanceOf(user1);
    console.log("User1 trB tokens: " + fromWei(bal) + " ETB");
    console.log("JCream crEth balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crETH_ADDRESS)) + " crEth");
    trbPrice = fromWei(await jCreamContract.getTrancheBExchangeRate(0))
    console.log("TrB price: " + trbPrice);
    console.log("CEther eth bal:" + fromWei(await web3.eth.getBalance(crETH_ADDRESS)));
    //console.log(stPrice.toString());
    tempAmnt = bal * Math.pow(10, -18);
    //console.log(tempAmnt.toString())
    taAmount = tempAmnt * trbPrice;
    console.log(taAmount);
    tx = await ethTrBContract.approve(jCreamContract.address, bal, {
      from: user1
    });

    tx = await jCreamContract.redeemTrancheBToken(0, bal, {
      from: user1
    });
    newBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trB interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trB tokens: " + fromWei(await ethTrBContract.balanceOf(user1)) + " ETB");
    console.log("JCream new crEth balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crETH_ADDRESS)) + " crEth");
    console.log("TrB price: " + fromWei(await jCreamContract.getTrancheBExchangeRate(0)));
  });
});