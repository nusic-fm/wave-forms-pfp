import { BigNumber } from '@ethersproject/bignumber';
import { Wallet } from '@ethersproject/wallet';
import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import { WaveFormsNFT, WaveFormsNFT__factory } from '../typechain';
var crypto = require('crypto');

describe("Nusic Wave Forms NFT Deployed: Pre-Sales Started", function () {

  let waveFormsNFT:WaveFormsNFT;
  let _privateAccountList:Wallet[] = [];
  let _privateSignatures:string[] = [];
  let _preSaleAccountList:Wallet[] = [];
  let _preSaleSignatures:string[] = [];
  before(async()=>{
    const [owner,addr1] = await ethers.getSigners();

    const WaveFormsNFT:WaveFormsNFT__factory =  await ethers.getContractFactory("WaveFormsNFT");
    waveFormsNFT = await WaveFormsNFT.deploy("ipfs://QmXsMLpKjznF3z1KsVm5tNs3E94vj4BFAyAHvD5RTWgQ1J");
    await waveFormsNFT.deployed(); 

    // Generate Accounts for Private Minting Testing
    // Assuming each address will buy 20 tokens so 1000/20 = 50 addresses will be generated
    let privateSaleTokenCount = 20;
    const addressToBeGeneratedForPrivateSale = (await waveFormsNFT.PRIVATE_SALE_MAX()).div(privateSaleTokenCount).toNumber();
    console.log("Private-Sale Accounts Generated = ",addressToBeGeneratedForPrivateSale);
    
    for(let i=0;i<addressToBeGeneratedForPrivateSale;i++) {
      var id = crypto.randomBytes(32).toString('hex');
      var privateKey = "0x"+id;
      var wallet = new ethers.Wallet(privateKey,ethers.provider);
      _privateAccountList.push(wallet);
      // Transfering funds to new account as they will not have balance
      // This not needed in private sale because payment will be received in advance with other channles
      // These addresses need some balance to make transaction
      await addr1.sendTransaction({
        to:wallet.address,
        value: ethers.utils.parseEther("1")
      })

      // Signature generations
      let messageHash = ethers.utils.solidityKeccak256(
        ["address","uint"],
        [wallet.address,privateSaleTokenCount]
      );
      let messageHashBinary = ethers.utils.arrayify(messageHash);
      let signature = await owner.signMessage(messageHashBinary);
      _privateSignatures.push(signature);
      //console.log("signature "+(i+1)+" = ",signature);
    }

    // Generate Accounts for Pre-Sale Minting Testing
    // Assuming each address will buy 50 tokens so 3000/50 = 60 addresses will be generated
    let preSaleTokenCount = await waveFormsNFT.MINT_PER_TXT();
    const addressToBeGeneratedForPreSale = (await waveFormsNFT.PRESALE_MAX()).div(preSaleTokenCount).toNumber();
    console.log("Pre-Sale Accounts Generated = ",addressToBeGeneratedForPreSale);
    //console.log("balance of owner before = ", ethers.utils.formatEther(await ethers.provider.getBalance(addr1.address)));
    for(let i=0;i<addressToBeGeneratedForPreSale;i++) {
      var id = crypto.randomBytes(32).toString('hex');
      var privateKey = "0x"+id;
      var wallet = new ethers.Wallet(privateKey,ethers.provider);
      _preSaleAccountList.push(wallet);
      // Transfering funds to new account as they will not have balance
      // In Pre-Sale mint we need to provide amount of token that will be enough for required token mint
      // Therefore assuming 50 token min with 0.08 price will require 4 ETH
      // Plus 1 ETH for additional transaction cost
      await addr1.sendTransaction({
        to:wallet.address,
        value: ethers.utils.parseEther("5")
      })

      // Signature generations
      let messageHash = ethers.utils.solidityKeccak256(
        ["address"],
        [wallet.address]
      );
      let messageHashBinary = ethers.utils.arrayify(messageHash);
      let signature = await owner.signMessage(messageHashBinary);
      _preSaleSignatures.push(signature);
      //console.log("signature "+(i+1)+" = ",signature);
    }
    //console.log("balance of owner after = ", ethers.utils.formatEther(await ethers.provider.getBalance(addr1.address)));
    //console.log(signatures);
  });

  it("Make privateSaleLive to true successfully", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(owner).togglePrivateSaleLive())).to.be.ok;
    expect((await waveFormsNFT.connect(addr1).privateSaleLive())).to.be.true;
  });

  it("Private Minting should be successfull for 1000 token", async function () {
    const [owner,addr1] = await ethers.getSigners();
    for(let i=0;i<_privateAccountList.length;i++) {
      expect((await waveFormsNFT.connect(_privateAccountList[i]).privateSaleMint(20,_privateSignatures[i]))).to.be.ok;
    }
  });

  it("privateSaleMinted = 1000, preSaleMinted, publicSaleMinted, teamClaimMinted and treasuryMinted should zero", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).privateSaleMinted())).to.be.equal(1000);
    expect((await waveFormsNFT.connect(addr1).preSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).publicSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).teamClaimMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).treasuryMinted())).to.be.equal(0);
  });

  it("Pre-Sale Minting should be failed if pre-Sale is false", async function () {
    const [owner,addr1] = await ethers.getSigners();
    await expect((waveFormsNFT.connect(_preSaleAccountList[0]).preSaleMint(5,_preSaleSignatures[0]))).to.be.revertedWith("Pre-Sale Closed");
  });

  it("Make preSaleLive to true successfully", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(owner).togglePreSaleLive())).to.be.ok;
    expect((await waveFormsNFT.connect(addr1).preSaleLive())).to.be.true;
  });

  it("Pre-Sale Minting for 1 token should be failed privateSaleLive is still true", async function () {
    const [owner,addr1] = await ethers.getSigners();
    await expect((waveFormsNFT.connect(_preSaleAccountList[0]).preSaleMint(1,_preSaleSignatures[0]))).to.be.revertedWith("Pre-Sale Closed");
  });

  it("Make privateSaleLive to false", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(owner).togglePrivateSaleLive())).to.be.ok;
    expect((await waveFormsNFT.connect(addr1).privateSaleLive())).to.be.false;
  });

  it("Pre-Sale Minting for 51 tokens should be failed for excceeding transaction limit ", async function () {
    const [owner,addr1] = await ethers.getSigners();
    await expect((waveFormsNFT.connect(_preSaleAccountList[0]).preSaleMint(51,_preSaleSignatures[0]))).to.be.revertedWith("Exceed Per Txt limit");
  });

  it("Pre-Sale Minting should be successful for 50 tokens", async function () {
    const [owner,addr1] = await ethers.getSigners();
    const mintCount = await waveFormsNFT.MINT_PER_TXT(); 
    const amount = (await waveFormsNFT.connect(addr1).price()).mul(mintCount);

    expect(await waveFormsNFT.connect(_preSaleAccountList[0]).preSaleMint(50,_preSaleSignatures[0], {value: amount})).to.be.ok;
  });

  it("privateSaleMinted = 1000, preSaleMinted = 50, publicSaleMinted, teamClaimMinted and treasuryMinted should zero", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).privateSaleMinted())).to.be.equal(1000);
    expect((await waveFormsNFT.connect(addr1).preSaleMinted())).to.be.equal(50);
    expect((await waveFormsNFT.connect(addr1).publicSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).teamClaimMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).treasuryMinted())).to.be.equal(0);
  });

  it("Pre-Sale Minting should be failed when funds are not sent for minting", async function () {
    const [owner,addr1] = await ethers.getSigners();
    await expect(waveFormsNFT.connect(_preSaleAccountList[0]).preSaleMint(1,_preSaleSignatures[0])).to.be.revertedWith("Insufficient Funds Sent");
  });

  it("Pre-Sale Minting should be failed when less amount of funds are sent", async function () {
    const [owner,addr1] = await ethers.getSigners();
    const amount = ethers.utils.parseEther("0.05");

    await expect(waveFormsNFT.connect(_preSaleAccountList[0]).preSaleMint(1,_preSaleSignatures[0],{value: amount})).to.be.revertedWith("Insufficient Funds Sent");
  });

  it("Pre-Sale Minting should be successfull for 2950 token", async function () {
    const [owner,addr1] = await ethers.getSigners();
    const mintCount = await waveFormsNFT.MINT_PER_TXT(); 
    const amount = (await waveFormsNFT.connect(addr1).price()).mul(mintCount);
    for(let i=1;i<_preSaleAccountList.length;i++) {
      expect((await waveFormsNFT.connect(_preSaleAccountList[i]).preSaleMint(50,_preSaleSignatures[i], {value:amount}))).to.be.ok;
    }
  });

  it("privateSaleMinted = 1000, preSaleMinted = 3000, publicSaleMinted, teamClaimMinted and treasuryMinted should zero", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).privateSaleMinted())).to.be.equal(1000);
    expect((await waveFormsNFT.connect(addr1).preSaleMinted())).to.be.equal(3000);
    expect((await waveFormsNFT.connect(addr1).publicSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).teamClaimMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).treasuryMinted())).to.be.equal(0);
  });

  it("Pre-Sale Minting should be failed when all allocated token already minted", async function () {
    const [owner,addr1] = await ethers.getSigners();
    const amount = await waveFormsNFT.connect(_preSaleAccountList[0]).price()

    await expect(waveFormsNFT.connect(_preSaleAccountList[0]).preSaleMint(1,_preSaleSignatures[0],{value: amount})).to.be.revertedWith("Pre-Sale Quota will Exceed");
  });
/*
  it("Treasury Minting should be failed by non-owner account", async function () {
    const [owner,addr1] = await ethers.getSigners();
    await expect((waveFormsNFT.connect(addr1).treasuryMint(5))).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Treasury Minting 5 tokens should be successful by owner account", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect(await waveFormsNFT.connect(owner).treasuryMint(5)).to.be.ok;
  });

  it("privateSaleMinted, preSaleMinted, publicSaleMinted and teamClaimMinted should be zero and treasuryMinted should 5", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).privateSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).preSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).publicSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).teamClaimMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).treasuryMinted())).to.be.equal(5);
  });

  it("Treasury Minting 500 token should fail -- Quota will Exceed", async function () {
    const [owner,addr1] = await ethers.getSigners();
    await expect((waveFormsNFT.connect(owner).treasuryMint(500))).to.be.revertedWith("Treasury Quota will Exceed");
    //expect(await waveFormsNFT.connect(owner).treasuryMint(500)).to.be.ok;
  });

  it("Treasury Minting for remaing 495 tokens should be successful by owner account", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect(await waveFormsNFT.connect(owner).treasuryMint(495)).to.be.ok;
  });

  it("Treasury Minting 1 token after all already minted should be failed by owner", async function () {
    const [owner,addr1] = await ethers.getSigners();
    //expect(await waveFormsNFT.connect(addr1).treasuryMint(5)).to.be.ok;
    await expect((waveFormsNFT.connect(owner).treasuryMint(1))).to.be.revertedWith("Treasury Quota will Exceed");
  });
*/
});
