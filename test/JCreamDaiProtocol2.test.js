const {
    BN,
    constants,
    ether,
    balance,
    expectEvent,
    expectRevert,
    time
} = require('@openzeppelin/test-helpers');
/*const {
    accounts,
    contract,
    web3
} = require('@openzeppelin/test-environment');*/
const {
    expect
} = require('chai');
const {
    ZERO_ADDRESS
} = constants;

const timeMachine = require('ganache-time-traveler');

//const BigNumber = web3.utils.BN;
require("chai")
    .use(require("chai-bn")(BN))
    .should();
/*
const JTrancheAToken = contract.fromArtifact('JTrancheAToken');
const JTrancheBToken = contract.fromArtifact('JTrancheBToken');
*/
const {
    deployMinimumFactory,
    getDeployedContracts,
    sendcDAItoProtocol,
    sendDAItoUsers
} = require('./JCreamProtocolFunctions');

contract('JProtocol', function (accounts) {
  const GAS_PRICE = 27000000000; //Gwei = 10 ** 9 wei

  tokenOwner = accounts[0];
  user1 = accounts[1];
  user2 = accounts[2];
  user3 = accounts[3];
  user4 = accounts[4];
  user5 = accounts[5];
  user6 = accounts[6];

  //beforeEach(async function () {

  //});

  //deployMinimumFactory(tokenOwner, factoryOwner, factoryAdmin);
  getDeployedContracts(accounts[0], accounts[1]);

  sendDAItoUsers(tokenOwner, user1, user2, user3, user4, user5, user6);

  it('send some DAI to CErc20', async function () {
    tx = await this.DAI.transfer(this.CErc20.address, web3.utils.toWei('100', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to JCream: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("transfer token costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    protBal = await this.DAI.balanceOf(this.CErc20.address);
    console.log(`protocol DAI Balance: ${web3.utils.fromWei(protBal, "ether")} DAI`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(100).toString());
  });

  it("user1 buys some token DaiTrA", async function () {
    console.log("is Dai allowed in JCream: "+ await this.JCream.isCTokenAllowed(this.DAI.address));
    console.log((await this.JCream.getCreamPrice(1)).toString());
    trPar = await this.JCream.trancheParameters(1);
    console.log("param tranche A: " + JSON.stringify(trPar));
    console.log("rpb tranche A: " +  await this.JCream.getTrancheACurrentRPB(1));
    tx = await this.JCream.calcRPBFromPercentage(1, {from: user1});
    console.log("rpb tranche A: " +  await this.JCream.getTrancheACurrentRPB(1));
    trAPrice = await this.JCream.getTrancheAExchangeRate(1, {from: user1});
    console.log("price tranche A: " + trAPrice);
    trPar = await this.JCream.trancheParameters(1);
    console.log("param tranche A: " + JSON.stringify(trPar));
    trParams = await this.JCream.trancheAddresses(1);
    expect(trParams.buyerCoinAddress).to.be.equal(this.DAI.address);
    expect(trParams.cTokenAddress).to.be.equal(this.CErc20.address);
    
    console.log("User1 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCream.address, web3.utils.toWei("10000", "ether"), {from: user1});
    tx = await this.JCream.buyTrancheAToken(1, web3.utils.toWei("10000", "ether"), {from: user1});
    console.log("User1 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    console.log("User1 trA tokens: "+ web3.utils.fromWei(await this.DaiTrA.balanceOf(user1), "ether") + " DTA");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.JCream.address), "ether") + " DAI");
    console.log("JCream cDAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getTrancheAExchangeRate(1), "ether"));
    console.log("Cream Price: " + await this.JCream.getCreamPrice(1));
    console.log("Cream TrA Value: " + web3.utils.fromWei(await this.JCream.getTrAValue(1), "ether"));
    console.log("Cream total Value: " + web3.utils.fromWei(await this.JCream.getTotalValue(1), "ether"));
  }); 

  it("user1 buys some token DaiTrB", async function () {
    console.log("User1 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    trAddr = await this.JCream.trancheAddresses(1);
    buyAddr = trAddr.buyerCoinAddress;
    console.log("Tranche Buyer Coin address: " + buyAddr);
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCream.getTrBValue(1), "ether"));
    console.log("Cream total Value: " + web3.utils.fromWei(await this.JCream.getTotalValue(1), "ether"));
    console.log("TrB total supply: " + web3.utils.fromWei(await this.DaiTrB.totalSupply(), "ether"));
    console.log("Cream TrA Value: " + web3.utils.fromWei(await this.JCream.getTrAValue(1), "ether"));
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, web3.utils.toWei("10000", "ether")), "ether"));
    tx = await this.DAI.approve(this.JCream.address, web3.utils.toWei("10000", "ether"), {from: user1});
    tx = await this.JCream.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user1});
    console.log("User1 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    console.log("User1 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user1), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    console.log("Cream price: " + web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getTrancheAExchangeRate(1), "ether"));
    console.log("Cream TrA Value: " + web3.utils.fromWei(await this.JCream.getTrAValue(1), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCream.getTrBValue(1), "ether"));
    console.log("Cream total Value: " + web3.utils.fromWei(await this.JCream.getTotalValue(1), "ether"));
  }); 

  it("user2 buys some token DaiTrB", async function () {
    console.log("User2 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    console.log("trB totalSupply: " + await this.DaiTrB.totalSupply());
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCream.getTrBValue(1), "ether"));
    tx = await this.DAI.approve(this.JCream.address, web3.utils.toWei("10000", "ether"), {from: user2});
    tx = await this.JCream.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user2});
    console.log("User2 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    console.log("User2 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user2), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    console.log("Cream price: " + web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
    console.log("Cream TrA Value: " + web3.utils.fromWei(await this.JCream.getTrAValue(1), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCream.getTrBValue(1), "ether"));
    console.log("Cream total Value: " + web3.utils.fromWei(await this.JCream.getTotalValue(1), "ether"));
  }); 

  it("Rewards distribution", async function () {
    tx = await this.SLICE.transfer(this.DaiTrA.address, web3.utils.toWei("10000", "ether"), {from: tokenOwner});
    console.log("DaiTrA SLICE tokens: "+ web3.utils.fromWei(await this.SLICE.balanceOf(this.DaiTrA.address), "ether") + " SLICE");
    tx = await this.SLICE.transfer(this.DaiTrB.address, web3.utils.toWei("20000", "ether"), {from: tokenOwner});
    console.log("DaiTrB SLICE tokens: "+ web3.utils.fromWei(await this.SLICE.balanceOf(this.DaiTrB.address), "ether") + " SLICE");
    tx = await this.DaiTrA.updateFundsReceived();
    tx = await this.DaiTrB.updateFundsReceived();
    console.log("User1 SLICE withdrawable balance on TrA: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrA: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user2), "ether") + " SLICE");
    console.log("User1 SLICE withdrawable balance on TrB: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrB: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user2), "ether") + " SLICE");
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlockNumber();
    console.log("Actual Block: " + block);
    for (i = 0; i < 100; i++) {
        await timeMachine.advanceBlock()
        //await time.advanceBlock()
    }
    console.log("New Actual Block: " + await web3.eth.getBlockNumber())

    await this.CErc20.setExchangeRateStored(new BN("21116912930684312"));
    console.log("Cream New price: " + await this.CErc20.exchangeRateStored());
  });

  it("user1 redeems token DaiTrA", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("JCream cDai balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    tx = await this.DaiTrA.approve(this.JCream.address, bal, {from: user1});
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getTrancheAExchangeRate(1), "ether"));
    tx = await this.JCream.redeemTrancheAToken(1, bal, {from: user1});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("User1 trA interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream new DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("Cream TrA Value: " + web3.utils.fromWei(await this.JCream.getTrAValue(1), "ether"));
    console.log("Cream total Value: " + web3.utils.fromWei(await this.JCream.getTotalValue(1), "ether"));
  }); 

  it("Rewards distribution only on tranche B", async function () {
    // tx = await this.SLICE.transfer(this.DaiTrA.address, web3.utils.toWei("1000", "ether"), {from: tokenOwner});
    // console.log("DaiTrA SLICE tokens: "+ web3.utils.fromWei(await this.SLICE.balanceOf(this.DaiTrA.address), "ether") + " SLICE");
    tx = await this.SLICE.transfer(this.DaiTrB.address, web3.utils.toWei("2000", "ether"), {from: tokenOwner});
    console.log("DaiTrB SLICE tokens: "+ web3.utils.fromWei(await this.SLICE.balanceOf(this.DaiTrB.address), "ether") + " SLICE");
    // tx = await this.DaiTrA.updateFundsReceived();
    tx = await this.DaiTrB.updateFundsReceived();
    console.log("User1 SLICE withdrawable balance on TrA: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrA: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user2), "ether") + " SLICE");
    console.log("User1 SLICE withdrawable balance on TrB: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrB: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user2), "ether") + " SLICE");
  });

  it('time passes to let the redeem timeout to expire', async function () {
    let block = await web3.eth.getBlockNumber();
    console.log("Actual Block: " + block);
    for (i = 0; i < 10; i++) {
        await timeMachine.advanceBlock()
        //await time.advanceBlock()
    }
    console.log("New Actual Block: " + await web3.eth.getBlockNumber())

    await this.CErc20.setExchangeRateStored(new BN("21116922930684312"));
    console.log("Cream New price: " + await this.CErc20.exchangeRateStored());
  });

  it("user1 redeems token DaiTrB", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCream cDai balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCream.address, bal, {from: user1});
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCream.getTrBValue(1), "ether"));
    tx = await this.JCream.redeemTrancheBToken(1, bal, {from: user1});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("User1 trB interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream new DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrA Value: " + web3.utils.fromWei(await this.JCream.getTrAValue(1), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCream.getTrBValue(1), "ether"));
    console.log("Cream total Value: " + web3.utils.fromWei(await this.JCream.getTotalValue(1), "ether"));
  }); 

  it("Rewards distribution only on tranche B", async function () {
    // tx = await this.SLICE.transfer(this.DaiTrA.address, web3.utils.toWei("1000", "ether"), {from: tokenOwner});
    // console.log("DaiTrA SLICE tokens: "+ web3.utils.fromWei(await this.SLICE.balanceOf(this.DaiTrA.address), "ether") + " SLICE");
    tx = await this.SLICE.transfer(this.DaiTrB.address, web3.utils.toWei("3000", "ether"), {from: tokenOwner});
    console.log("DaiTrB SLICE tokens: "+ web3.utils.fromWei(await this.SLICE.balanceOf(this.DaiTrB.address), "ether") + " SLICE");
    // tx = await this.DaiTrA.updateFundsReceived();
    tx = await this.DaiTrB.updateFundsReceived();
    console.log("User1 SLICE withdrawable balance on TrA: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrA: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user2), "ether") + " SLICE");
    console.log("User1 SLICE withdrawable balance on TrB: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrB: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user2), "ether") + " SLICE");
  });

  it("user2 redeems token DaiTrB", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether");
    console.log("User2 Dai balance: "+ oldBal + " DAI");
    console.log("User2 Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    bal = await this.DaiTrB.balanceOf(user2);
    console.log("User2 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCream cDai balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCream.address, bal, {from: user2});
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCream.getTrBValue(1), "ether"));
    console.log("TrB total supply: " +  web3.utils.fromWei(await this.DaiTrB.totalSupply(), "ether"));
    console.log("TrB Price: " +  web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    tx = await this.JCream.redeemTrancheBToken(1, bal, {from: user2});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether");
    console.log("User2 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user2);
    console.log("User2 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("User2 trB interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream new DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrA Value: " + web3.utils.fromWei(await this.JCream.getTrAValue(1), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCream.getTrBValue(1), "ether"));
    console.log("Cream total Value: " + web3.utils.fromWei(await this.JCream.getTotalValue(1), "ether"));
  }); 

  it("Rewards withdrawn", async function () {
    console.log("User1 SLICE balance: "+ web3.utils.fromWei(await this.SLICE.balanceOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE balance: "+ web3.utils.fromWei(await this.SLICE.balanceOf(user2), "ether") + " SLICE");
    console.log("User1 SLICE withdrawable balance on TrA: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrA: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user2), "ether") + " SLICE");
    console.log("User1 SLICE withdrawable balance on TrB: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrB: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user2), "ether") + " SLICE");
    tx = await this.DaiTrA.withdrawFunds({from: user1});
    tx = await this.DaiTrA.withdrawFunds({from: user2});
    tx = await this.DaiTrB.withdrawFunds({from: user1});
    tx = await this.DaiTrB.withdrawFunds({from: user2});
    //console.log("User1 SLICE withdrawn balance: "+ web3.utils.fromWei(await this.DaiTrA.withdrawnFundsOf(user1), "ether") + " SLICE");
    console.log("User1 SLICE balance: "+ web3.utils.fromWei(await this.SLICE.balanceOf(user1), "ether") + " SLICE");
    console.log("User1 SLICE withdrawable balance on TrA after withdraw: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user1), "ether") + " SLICE");
    console.log("User1 SLICE withdrawable balance on TrB after withdraw: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user1), "ether") + " SLICE");
    //console.log("User1 SLICE withdrawn balance: "+ web3.utils.fromWei(await this.DaiTrA.withdrawnFundsOf(user1), "ether") + " SLICE");
    console.log("User2 SLICE balance: "+ web3.utils.fromWei(await this.SLICE.balanceOf(user2), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrA after withdraw: "+ web3.utils.fromWei(await this.DaiTrA.withdrawableFundsOf(user2), "ether") + " SLICE");
    console.log("User2 SLICE withdrawable balance on TrB after withdraw: "+ web3.utils.fromWei(await this.DaiTrB.withdrawableFundsOf(user2), "ether") + " SLICE");
    console.log("User1 already withdrawn rewards amount DaiTrA: " + web3.utils.fromWei(await this.DaiTrA.withdrawnFundsOf(user1)));
    console.log("User2 already withdrawn rewards amount DaiTrA: " + web3.utils.fromWei(await this.DaiTrA.withdrawnFundsOf(user2)));
    console.log("User1 already withdrawn rewards amount DaiTrB: " + web3.utils.fromWei(await this.DaiTrB.withdrawnFundsOf(user1)));
    console.log("User2 already withdrawn rewards amount DaiTrB: " + web3.utils.fromWei(await this.DaiTrB.withdrawnFundsOf(user2)));
  });

});