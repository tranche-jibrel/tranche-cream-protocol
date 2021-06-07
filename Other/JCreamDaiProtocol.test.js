const {
    BN,
    constants,
    ether,
    balance,
    expectEvent,
    expectRevert,
    time
} = require('@openzeppelin/test-helpers');
const {
    accounts,
    contract,
    web3
} = require('@openzeppelin/test-environment');
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

const JTrancheAToken = contract.fromArtifact('JTrancheAToken');
const JTrancheBToken = contract.fromArtifact('JTrancheBToken');

const {
    deployMinimumFactory,
    sendcDAItoProtocol,
    sendDAItoUsers
} = require('../test/JCreamProtocolFunctions');

describe('JProtocol', function () {
  const GAS_PRICE = 27000000000; //Gwei = 10 ** 9 wei

  const [tokenOwner, factoryOwner, factoryAdmin, user1, user2, user3, user4, user5, user6] = accounts;

  //beforeEach(async function () {

  //});

  deployMinimumFactory(tokenOwner, factoryOwner, factoryAdmin);

  //sendcDAItoProtocol(tokenOwner);

  sendDAItoUsers(tokenOwner, user1, user2, user3, user4, user5, user6);

  it('send some DAI to CErc20', async function () {
    tx = await this.DAI.transfer(this.CErc20.address, web3.utils.toWei('1000', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to JCream: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("transfer token costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    protBal = await this.DAI.balanceOf(this.CErc20.address);
    console.log(`protocol DAI Balance: ${web3.utils.fromWei(protBal, "ether")} DAI`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(1000).toString());
  });

  it("user1 buys some token EthTrA", async function () {
    console.log("is Dai allowed in JCream: "+ await this.JCream.isCTokenAllowed(this.DAI.address));
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
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
    console.log("Cream Price: " + await this.JCream.getCreamPrice(1));
  }); 

  it("user2 buys some token EthTrA", async function () {
    console.log("User2 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCream.address, web3.utils.toWei("10000", "ether"), {from: user2});
    tx = await this.JCream.buyTrancheAToken(1, web3.utils.toWei("10000", "ether"), {from: user2});
    console.log("User2 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    console.log("User2 trA tokens: "+ web3.utils.fromWei(await this.DaiTrA.balanceOf(user2), "ether") + " DTA");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
  }); 

  it("user3 buys some token EthTrA", async function () {
    console.log("User3 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCream.address, web3.utils.toWei("10000", "ether"), {from: user3});
    tx = await this.JCream.buyTrancheAToken(1, web3.utils.toWei("10000", "ether"), {from: user3});
    console.log("User3 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    console.log("User3 trA tokens: "+ web3.utils.fromWei(await this.DaiTrA.balanceOf(user3), "ether") + " DTA");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
  }); 

  it("user1 buys some token EthTrB", async function () {
    console.log("User1 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    trAddr = await this.JCream.trancheAddresses(1);
    buyAddr = trAddr.buyerCoinAddress;
    console.log("Tranche Buyer Coin address: " + buyAddr);
    tx = await this.DAI.approve(this.JCream.address, web3.utils.toWei("10000", "ether"), {from: user1});
    tx = await this.JCream.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user1});
    console.log("User1 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    console.log("User1 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user1), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    console.log("Cream price: " + web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
  }); 

  it("user2 buys some token EthTrB", async function () {
    console.log("User2 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    console.log("trB totalSupply: " + await this.DaiTrB.totalSupply());
    console.log("TrB price: " + await this.JCream.getTrancheBExchangeRate(1, 0));
    tx = await this.DAI.approve(this.JCream.address, web3.utils.toWei("10000", "ether"), {from: user2});
    tx = await this.JCream.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user2});
    console.log("User2 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    console.log("User2 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user2), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    console.log("Cream price: " + web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
  }); 

  it("user3 buys some token EthTrB", async function () {
    console.log("User3 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCream.address, web3.utils.toWei("10000", "ether"), {from: user3});
    tx = await this.JCream.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user3});
    console.log("User3 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    console.log("User3 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user3), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    console.log("Cream price: " + web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
  }); 

  it('time passes...', async function () {
    let block = await web3.eth.getBlockNumber();
    console.log("Actual Block: " + block.number);
    for (i = 0; i < 100; i++) {
        await timeMachine.advanceBlock()
    }
    console.log("New Actual Block: " + await web3.eth.getBlockNumber())

    await this.CErc20.setExchangeRateStored(new BN("21116912930684312")); //21116902930684312
    console.log("Cream New price: " + await this.CErc20.exchangeRateStored());
  });

  it("user1 redeems token EthTrA", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("JCream cDai balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    tx = await this.DaiTrA.approve(this.JCream.address, bal, {from: user1});
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
    tx = await this.JCream.redeemTrancheAToken(1, bal, {from: user1});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("User1 trA interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream new DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
  }); 

  it('time passes to let the redeem timeout to expire', async function () {
    let block = await web3.eth.getBlockNumber();
    console.log("Actual Block: " + block.number);
    for (i = 0; i < 10; i++) {
        await timeMachine.advanceBlock()
    }
    console.log("New Actual Block: " + await web3.eth.getBlockNumber())

    await this.CErc20.setExchangeRateStored(new BN("21116922930684312")); //21116912930684312
    console.log("Cream New price: " + await this.CErc20.exchangeRateStored());
  });

  it("user1 redeems token EthTrB", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCream cDai balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCream.address, bal, {from: user1});
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    tx = await this.JCream.redeemTrancheBToken(1, bal, {from: user1});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("User1 trB interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream new DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
  }); 

  it("user2 redeems token EthTrA", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether");
    console.log("User2 Dai balance: "+ oldBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user2);
    console.log("User2 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("JCream cDai balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    tx = await this.DaiTrA.approve(this.JCream.address, bal, {from: user2});
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
    tx = await this.JCream.redeemTrancheAToken(1, bal, {from: user2});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether");
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user2);
    console.log("User2 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("User2 trB interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream new DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
  }); 

  it('time passes to let the redeem timeout to expire', async function () {
    let block = await web3.eth.getBlockNumber();
    console.log("Actual Block: " + block.number);
    for (i = 0; i < 10; i++) {
        await timeMachine.advanceBlock()
    }
    console.log("New Actual Block: " + await web3.eth.getBlockNumber())

    await this.CErc20.setExchangeRateStored(new BN("21116932930684312"));  //21116912930684312
    console.log("Cream New price: " + await this.CErc20.exchangeRateStored());
  });

  it("user2 redeems token EthTrB", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether");
    console.log("User2 Dai balance: "+ oldBal + " DAI");
    console.log("User2 Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    bal = await this.DaiTrB.balanceOf(user2);
    console.log("User2 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCream cDai balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCream.address, bal, {from: user2});
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    tx = await this.JCream.redeemTrancheBToken(1, bal, {from: user2});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether");
    console.log("User2 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user2);
    console.log("User2 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("User2 trB interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream new DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
  }); 

  it("user3 redeems token EthTrA", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether");
    console.log("User3 Dai balance: "+ oldBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user3);
    console.log("User3 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("JCream cDai balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    tx = await this.DaiTrA.approve(this.JCream.address, bal, {from: user3});
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCream.getCreamPrice(1), "ether"));
    tx = await this.JCream.redeemTrancheAToken(1, bal, {from: user3});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether");
    console.log("User3 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user3);
    console.log("User3 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("User3 trA interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream new DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
  }); 

  it('time passes to let the redeem timeout to expire', async function () {
    let block = await web3.eth.getBlockNumber();
    console.log("Actual Block: " + block.number);
    for (i = 0; i < 10; i++) {
        await timeMachine.advanceBlock()
    }
    console.log("New Actual Block: " + await web3.eth.getBlockNumber())

    await this.CErc20.setExchangeRateStored(new BN("21116942930684312")); //21116932930684312
    console.log("Cream New price: " + await this.CErc20.exchangeRateStored());
  });

  it("user3 redeems token EthTrB", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether");
    console.log("User3 Dai balance: "+ oldBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user3);
    console.log("User3 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCream cDai balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCream.address, bal, {from: user3});
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    tx = await this.JCream.redeemTrancheBToken(1, bal, {from: user3});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether");
    console.log("User3 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user3);
    console.log("User3 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("User3 trA interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCream new DAI balance: "+ web3.utils.fromWei(await this.JCream.getTokenBalance(this.CErc20.address), "ether") + " cDai");
    bal = await this.DaiTrA.totalSupply();
    console.log("TrA total supply: "+ web3.utils.fromWei(bal, "ether") + " ETA");
    bal = await this.DaiTrB.totalSupply();
    console.log("TrB total supply: "+ web3.utils.fromWei(bal, "ether") + " ETB");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCream.getTrancheBExchangeRate(1, 0), "ether"));
    console.log("Cream Price: " + await this.JCream.getCreamPrice(1));
  }); 

  it("user1 buys some token EthTrA", async function () {
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
  }); 

  it('time passes to let the redeem timeout to expire', async function () {
    let block = await web3.eth.getBlockNumber();
    console.log("Actual Block: " + block.number);
    for (i = 0; i < 10; i++) {
        await timeMachine.advanceBlock()
    }
    console.log("New Actual Block: " + await web3.eth.getBlockNumber())

    await this.CErc20.setExchangeRateStored(new BN("21116942930684312"));  //21116942930684312 price don't change
    console.log("Cream New price: " + await this.CErc20.exchangeRateStored());
  });

  it("user1 redeems token EthTrA", async function () {
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
  }); 

  it("send other tokens to tranche A and emergency withdraw", async function () {
    tx = await this.SLICE.transfer(this.DaiTrA.address, web3.utils.toWei('1000', 'ether'), {
      from: tokenOwner
    });
    bal = await this.SLICE.balanceOf(user1);
    console.log("user1 SLICE balance: "+ web3.utils.fromWei(bal, "ether") + " SLICE");
    bal = await this.SLICE.balanceOf(this.DaiTrA.address);
    console.log("trA SLICE balance: "+ web3.utils.fromWei(bal, "ether") + " SLICE");
    tx = await this.JCream.emergencyRemoveTokensFromTranche(this.DaiTrA.address, this.SLICE.address, user1, bal, {from: factoryAdmin});
    bal = await this.SLICE.balanceOf(this.DaiTrA.address);
    console.log("trA SLICE balance after emergency withdraw: "+ web3.utils.fromWei(bal, "ether") + " SLICE");
    bal = await this.SLICE.balanceOf(user1);
    console.log("user1 SLICE balance after emergency withdraw: "+ web3.utils.fromWei(bal, "ether") + " SLICE");
  });

});