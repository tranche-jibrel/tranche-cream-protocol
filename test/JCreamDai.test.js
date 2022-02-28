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

const {ZERO_ADDRESS} = constants;

const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const CREAM_ADDRESS = "0x2ba592F78dB6436527729929AAf6c908497cB200";
const crTROLLER_ADDRESS = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";

const fs = require('fs');
const DAI_ABI = JSON.parse(fs.readFileSync('./test/utils/Dai.abi', 'utf8'));

const UnBlockedAccount = '0x5ad3330aebdd74d7dda641d37273ac1835ee9330';

const fromWei = (x) => web3.utils.fromWei(x.toString());
const toWei = (x) => web3.utils.toWei(x.toString());
const fromWei8Dec = (x) => x / Math.pow(10, 8);
const toWei8Dec = (x) => x * Math.pow(10, 8);

const crDAI_ADDRESS = "0x92B767185fB3B04F881e3aC8e5B0662a027A1D9f"
const crDAIComptroller = "0x3d5BC3c8d13dcB8bF317092d84783c2697AE9258"
const cyDAI = "0x8e595470Ed749b85C6F7669de83EAe304C2ec68F"
const cyDAIComptroller = "0xAB1c342C7bf5Ec5F02ADEA1c2270670bCa144CbB"


let daiContract, jFCContract, jATContract, jTrDeplContract, jCreamContract;
let ethTrAContract, ethTrBContract, daiTrAContract, daiTrBContract;
let tokenOwner, user1;

contract("JCream crDai mainnet", function (accounts) {

    it("ETH balances", async function () {
        //accounts = await web3.eth.getAccounts();
        tokenOwner = accounts[0];
        user1 = accounts[1];
        user2 = accounts[2];
        console.log(tokenOwner);
        console.log(await web3.eth.getBalance(tokenOwner));
        console.log(await web3.eth.getBalance(user1));
    });

    it("DAI total Supply sent to user1", async function () {
        daiContract = new web3.eth.Contract(DAI_ABI, DAI_ADDRESS);
        // daiContract = await myERC20.deployed();
        result = await daiContract.methods.totalSupply().call();
        console.log(result.toString())
        console.log("UnBlockedAccount DAI balance: " + fromWei(await daiContract.methods.balanceOf(UnBlockedAccount).call()) + " DAI");
        // expect(fromWei(result.toString())).to.be.equal(MYERC20_TOKEN_SUPPLY.toString());
        await daiContract.methods.transfer(user1, toWei("100")).send({
            from: UnBlockedAccount
        })
        console.log("UnBlockedAccount DAI balance: " + fromWei(await daiContract.methods.balanceOf(UnBlockedAccount).call()) + " DAI");
        console.log("user1 DAI balance: " + fromWei(await daiContract.methods.balanceOf(user1).call()) + " DAI");
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

    it("user1 buys some token daiTrA", async function () {
        console.log("is Dai allowed in JCream: " + await jCreamContract.isCrTokenAllowed(DAI_ADDRESS));
        console.log((await jCreamContract.getCreamPrice(1)).toString());
        trPar = await jCreamContract.trancheParameters(1);
        console.log("param tranche A: " + JSON.stringify(trPar, ["trancheAFixedPercentage", "trancheALastActionTime", "storedTrancheAPrice", "trancheACurrentRPS", "crTokenDecimals", "underlyingDecimals"]));
        tx = await jCreamContract.calcRPBFromPercentage(1, {
            from: user1
        });
        console.log("rps tranche A: " + await jCreamContract.getTrancheACurrentRPS(1));
        trAPrice = await jCreamContract.getTrancheAExchangeRate(1, {
            from: user1
        });
        console.log("price tranche A: " + fromWei(trAPrice));

        trParams = await jCreamContract.trancheAddresses(1);
        expect(trParams.buyerCoinAddress).to.be.equal(DAI_ADDRESS);
        console.log("User1 DAI balance: " + fromWei(await daiContract.methods.balanceOf(user1).call()) + " DAI");

        tx = await daiContract.methods.approve(jCreamContract.address, toWei("10")).send({
            from: user1
        });
        tx = await jCreamContract.buyTrancheAToken(1, toWei("10"), {
            from: user1
        });

        console.log("User1 New DAI balance: " + fromWei(await daiContract.methods.balanceOf(user1).call()) + " DAI");
        console.log("User1 trA tokens: " + fromWei(await daiTrAContract.balanceOf(user1)) + " DTA");
        console.log("JCream DAI balance: " + fromWei(await daiContract.methods.balanceOf(jCreamContract.address).call()) + " DAI");
        console.log("JCream crDAI balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        console.log("TrA price: " + fromWei(await jCreamContract.getTrancheAExchangeRate(1)));
        console.log("Cream Price: " + await jCreamContract.getCreamPrice(1));
        console.log("Cream TrA Value: " + fromWei(await jCreamContract.getTrAValue(1)));
        console.log("Cream total Value: " + fromWei(await jCreamContract.getTotalValue(1)));
    });

    it('transferring Tranche A tokens should also transfer staking details', async function () {
        bal1 = await daiTrAContract.balanceOf(user1)
        console.log("user1 trA Balance: " + fromWei(bal1) + " DTA")
        stkDetails = await jCreamContract.stakingDetailsTrancheA(user1, 1, 1);
        console.log("user1 stkDetails, startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString())
        bal2 = await daiTrAContract.balanceOf(user2)
        expect(bal2.toString()).to.be.equal("0")

        await daiTrAContract.transfer(user2, toWei("200"), {
            from: user1
        });
        bal1 = await daiTrAContract.balanceOf(user1)
        bal2 = await daiTrAContract.balanceOf(user2)
        console.log("user1 trA Balance: " + fromWei(bal1) + " DTA")
    });

    it("user1 buys some token daiTrB", async function () {
        console.log("User1 DAI balance: " + fromWei(await daiContract.methods.balanceOf(user1).call()) + " DAI");
        trAddr = await jCreamContract.trancheAddresses(1);
        buyAddr = trAddr.buyerCoinAddress;
        console.log("Tranche Buyer Coin address: " + buyAddr);
        console.log("TrB value: " + fromWei(await jCreamContract.getTrBValue(1)));
        console.log("Cream total Value: " + fromWei(await jCreamContract.getTotalValue(1)));
        console.log("TrB total supply: " + fromWei(await daiTrBContract.totalSupply()));
        console.log("Cream TrA Value: " + fromWei(await jCreamContract.getTrAValue(1)));
        console.log("TrB price: " + fromWei(await jCreamContract.getTrancheBExchangeRate(1, toWei("10000"))));

        tx = await daiContract.methods.approve(jCreamContract.address, toWei("10")).send({
            from: user1
        });
        tx = await jCreamContract.buyTrancheBToken(1, toWei("10"), {
            from: user1
        });

        console.log("User1 New DAI balance: " + fromWei(await daiContract.methods.balanceOf(user1).call()) + " DAI");
        console.log("User1 trB tokens: " + fromWei(await daiTrBContract.balanceOf(user1)) + " DTB");
        console.log("JCream crDAI balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        console.log("TrB price: " + fromWei(await jCreamContract.getTrancheBExchangeRate(1, 0)));
        console.log("Cream price: " + fromWei(await jCreamContract.getCreamPrice(1)));
        console.log("TrA price: " + fromWei(await jCreamContract.getTrancheAExchangeRate(1)));
        console.log("Cream TrA Value: " + fromWei(await jCreamContract.getTrAValue(1)));
        console.log("TrB value: " + fromWei(await jCreamContract.getTrBValue(1)));
        console.log("Cream total Value: " + fromWei(await jCreamContract.getTotalValue(1)));
    });

    it('transferring Tranche B tokens should also transfer staking details', async function () {
        bal1 = await daiTrBContract.balanceOf(user1)
        console.log("user1 trB Balance: " + fromWei(bal1) + " DTB")
        stkDetails = await jCreamContract.stakingDetailsTrancheB(user1, 1, 1);
        console.log("user1 stkDetails, startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString())
        bal2 = await daiTrBContract.balanceOf(user2)
        expect(bal2.toString()).to.be.equal("0")

        await daiTrBContract.transfer(user2, toWei("5"), {
            from: user1
        });
        bal1 = await daiTrBContract.balanceOf(user1)
        bal2 = await daiTrBContract.balanceOf(user2)
        console.log("user1 trB Balance: " + fromWei(bal1) + " DTB")
    });

    it('time passes...', async function () {
        let block = await web3.eth.getBlockNumber();
        console.log("Actual Block: " + block);
        for (i = 0; i < 100; i++) {
            await timeMachine.advanceBlock()
        }
        console.log("New Actual Block: " + await web3.eth.getBlockNumber())

        //   await cERC20Contract.setExchangeRateStored(new BN("21065567570282878")); //21061567570282878
        //   console.log("Cream New price: " + await cEtherContract.exchangeRateStored());
    });

    it("user1 redeems token daiTrA", async function () {
        oldBal = fromWei(await daiContract.methods.balanceOf(user1).call());
        console.log("User1 Dai balance: " + oldBal + " DAI");
        bal = await daiTrAContract.balanceOf(user1);
        console.log("User1 trA tokens: " + fromWei(bal) + " DTA");
        tot = await daiTrAContract.totalSupply();
        console.log("trA tokens total: " + fromWei(tot) + " DTA");
        console.log("JCream cDai balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        tx = await daiTrAContract.approve(jCreamContract.address, bal, {
            from: user1
        });
        console.log("TrA price: " + fromWei(await jCreamContract.getTrancheAExchangeRate(1)));
        tx = await jCreamContract.redeemTrancheAToken(1, bal, {
            from: user1
        });
        newBal = fromWei(await daiContract.methods.balanceOf(user1).call());
        console.log("User1 New Dai balance: " + newBal + " DAI");
        bal = await daiTrAContract.balanceOf(user1);
        console.log("User1 trA tokens: " + fromWei(bal) + " DTA");
        console.log("User1 trA interest: " + (newBal - oldBal) + " DAI");
        console.log("JCream new crDAI balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        console.log("Cream TrA Value: " + fromWei(await jCreamContract.getTrAValue(1)));
        console.log("Cream total Value: " + fromWei(await jCreamContract.getTotalValue(1)));
    });

    it("user2 redeems token daiTrA", async function () {
        oldBal = fromWei(await daiContract.methods.balanceOf(user2).call());
        console.log("User1 Dai balance: " + oldBal + " DAI");
        bal = await daiTrAContract.balanceOf(user2);
        console.log("User1 trA tokens: " + fromWei(bal) + " DTA");
        tot = await daiTrAContract.totalSupply();
        console.log("trA tokens total: " + fromWei(tot) + " DTA");
        console.log("JCream cDai balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        tx = await daiTrAContract.approve(jCreamContract.address, bal, {
            from: user2
        });
        console.log("TrA price: " + fromWei(await jCreamContract.getTrancheAExchangeRate(1)));
        tx = await jCreamContract.redeemTrancheAToken(1, bal, {
            from: user2
        });
        newBal = fromWei(await daiContract.methods.balanceOf(user2).call());
        console.log("User1 New Dai balance: " + newBal + " DAI");
        bal = await daiTrAContract.balanceOf(user2);
        console.log("User1 trA tokens: " + fromWei(bal) + " DTA");
        console.log("User1 trA interest: " + (newBal - oldBal) + " DAI");
        console.log("JCream new crDAI balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        console.log("Cream TrA Value: " + fromWei(await jCreamContract.getTrAValue(1)));
        console.log("Cream total Value: " + fromWei(await jCreamContract.getTotalValue(1)));
    });

    it('time passes...', async function () {
        let block = await web3.eth.getBlockNumber();
        console.log("Actual Block: " + block);
        for (i = 0; i < 100; i++) {
            await timeMachine.advanceBlock()
        }
        console.log("New Actual Block: " + await web3.eth.getBlockNumber())
    });

    it("user1 redeems token daiTrB", async function () {
        oldBal = fromWei(await daiContract.methods.balanceOf(user1).call());
        console.log("User1 Dai balance: " + oldBal + " DAI");
        bal = await daiTrBContract.balanceOf(user1);
        console.log("User1 trB tokens: " + fromWei(bal) + " DTB");
        console.log("JCream cDai balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        tx = await daiTrBContract.approve(jCreamContract.address, bal, {
            from: user1
        });
        console.log("TrB price: " + fromWei(await jCreamContract.getTrancheBExchangeRate(1, 0)));
        console.log("TrB value: " + fromWei(await jCreamContract.getTrBValue(1)));
        tx = await jCreamContract.redeemTrancheBToken(1, bal, {
            from: user1
        });
        newBal = fromWei(await daiContract.methods.balanceOf(user1).call());
        console.log("User1 New Dai balance: " + newBal + " DAI");
        bal = await daiTrBContract.balanceOf(user1);
        console.log("User1 trB tokens: " + fromWei(bal) + " DTB");
        console.log("User1 trB interest: " + (newBal - oldBal) + " DAI");
        console.log("JCream new crDAI balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        console.log("TrA Value: " + fromWei(await jCreamContract.getTrAValue(1)));
        console.log("TrB value: " + fromWei(await jCreamContract.getTrBValue(1)));
        console.log("Cream total Value: " + fromWei(await jCreamContract.getTotalValue(1)));
    });

    it("user2 redeems token daiTrB", async function () {
        oldBal = fromWei(await daiContract.methods.balanceOf(user2).call());
        console.log("User1 Dai balance: " + oldBal + " DAI");
        bal = await daiTrBContract.balanceOf(user2);
        console.log("User1 trB tokens: " + fromWei(bal) + " DTB");
        console.log("JCream cDai balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        tx = await daiTrBContract.approve(jCreamContract.address, bal, {
            from: user2
        });
        console.log("TrB price: " + fromWei(await jCreamContract.getTrancheBExchangeRate(1, 0)));
        console.log("TrB value: " + fromWei(await jCreamContract.getTrBValue(1)));
        tx = await jCreamContract.redeemTrancheBToken(1, bal, {
            from: user2
        });
        newBal = fromWei(await daiContract.methods.balanceOf(user2).call());
        console.log("User1 New Dai balance: " + newBal + " DAI");
        bal = await daiTrBContract.balanceOf(user2);
        console.log("User1 trB tokens: " + fromWei(bal) + " DTB");
        console.log("User1 trB interest: " + (newBal - oldBal) + " DAI");
        console.log("JCream new crDAI balance: " + fromWei8Dec(await jCreamContract.getTokenBalance(crDAI_ADDRESS)) + " crDai");
        console.log("TrA Value: " + fromWei(await jCreamContract.getTrAValue(1)));
        console.log("TrB value: " + fromWei(await jCreamContract.getTrBValue(1)));
        console.log("Cream total Value: " + fromWei(await jCreamContract.getTotalValue(1)));
    });

    describe('higher percentage for test coverage', function() {
        it('calling unfrequently functions', async function () {    
          await jCreamContract.setNewEnvironment(jATContract.address, jFCContract.address, jTrDeplContract.address, CREAM_ADDRESS, crTROLLER_ADDRESS, {from: tokenOwner})

          await jCreamContract.getCreamSupplyRPB(1)

          await jCreamContract.redeemCrTokenAmount(0, 0)
          await jCreamContract.redeemCrTokenAmount(1, 0)

          await jCreamContract.withdrawEthToFeesCollector(0)
    
          await jCreamContract.setDecimals(1, 8, 18)
    
          await jCreamContract.setTrancheRedemptionPercentage(1, 9950)
    
          await jCreamContract.setRedemptionTimeout(3)
    
          await jCreamContract.setTrancheAFixedPercentage(1, toWei("0.03"))
    
          await jCreamContract.getTrancheACurrentRPS(1)
    
          await jCreamContract.transferTokenToFeesCollector(CREAM_ADDRESS, 0)
    
          await jCreamContract.getTotalCreamAccrued()
          await jCreamContract.claimTotalCreamAccruedToReceiver(tokenOwner)
    
        });
    })

});