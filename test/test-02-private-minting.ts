import { BigNumber } from '@ethersproject/bignumber';
import { Wallet } from '@ethersproject/wallet';
import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import { WaveFormsNFT, WaveFormsNFT__factory } from '../typechain';
var crypto = require('crypto');

describe("Nusic Wave Forms NFT Deployed: Private Sales Started", function () {

  let waveFormsNFT:WaveFormsNFT;
  let _accountList:Wallet[] = [];
  let signatures:string[] = [];
  before(async()=>{
    const [owner,addr1] = await ethers.getSigners();

    const WaveFormsNFT:WaveFormsNFT__factory =  await ethers.getContractFactory("WaveFormsNFT");
    waveFormsNFT = await WaveFormsNFT.deploy("ipfs://QmXsMLpKjznF3z1KsVm5tNs3E94vj4BFAyAHvD5RTWgQ1J");
    await waveFormsNFT.deployed(); 

    // Generate Accounts for Testing
    // Assuming each address will buy 20 tokens so 1000/20 = 50 addresses will be generated
    let tokenCount = 20;
    const addressToBeGeneratedForPrivateSale = (await waveFormsNFT.PRIVATE_SALE_MAX()).div(tokenCount).toNumber();
    console.log("Private-Sale Accounts Generated = ",addressToBeGeneratedForPrivateSale);
    
    for(let i=0;i<addressToBeGeneratedForPrivateSale;i++) {
      var id = crypto.randomBytes(32).toString('hex');
      var privateKey = "0x"+id;
      var wallet = new ethers.Wallet(privateKey,ethers.provider);
      _accountList.push(wallet);
      // Transfering funds to new account as they will not have balance
      // This not needed in private sale because payment will be received in advance with other channles
      await addr1.sendTransaction({
        to:wallet.address,
        value: ethers.utils.parseEther("1")
      })

      // Signature generations
      let messageHash = ethers.utils.solidityKeccak256(
        ["address","uint"],
        [wallet.address,tokenCount]
      );
      let messageHashBinary = ethers.utils.arrayify(messageHash);
      let signature = await owner.signMessage(messageHashBinary);
      signatures.push(signature);
      //console.log("signature "+(i+1)+" = ",signature);
    }
    //console.log(signatures);
  });

  it("All Constant parameters are properly set", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).PRIVATE_SALE_MAX())).to.be.equal(1000);
    expect((await waveFormsNFT.connect(addr1).PRESALE_MAX())).to.be.equal(3000);
    expect((await waveFormsNFT.connect(addr1).PUBLIC_SALE_MAX())).to.be.equal(5000);
    expect((await waveFormsNFT.connect(addr1).TEAM_CLAIM_MAX())).to.be.equal(500);
    expect((await waveFormsNFT.connect(addr1).TREASURY_MAX())).to.be.equal(500);
    expect((await waveFormsNFT.connect(addr1).MAX_SUPPLY())).to.be.equal(10000);
    expect((await waveFormsNFT.connect(addr1).MINT_PER_TXT())).to.be.equal(50);
    expect((await waveFormsNFT.connect(addr1).MINT_PER_ADDR())).to.be.equal(100);
  });

  it("Price of each token is properly set", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).price())).to.be.equal(ethers.utils.parseEther("0.08"));
  });

  it("Base URI should be empty and default URI should be set", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).defaultURI())).to.be.equal("ipfs://QmXsMLpKjznF3z1KsVm5tNs3E94vj4BFAyAHvD5RTWgQ1J");
    expect((await waveFormsNFT.connect(addr1).baseURI())).to.be.equal("");
  });

  it("privateSaleMinted, preSaleMinted, publicSaleMinted, teamClaimMinted and treasuryMinted should zero", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).privateSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).preSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).publicSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).teamClaimMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).treasuryMinted())).to.be.equal(0);
  });

  it("privateSaleLive, preSaleLive, publicSaleLive and revealed should be false", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).privateSaleLive())).to.be.false;
    expect((await waveFormsNFT.connect(addr1).preSaleLive())).to.be.false;
    expect((await waveFormsNFT.connect(addr1).publicSaleLive())).to.be.false;
    expect((await waveFormsNFT.connect(addr1).revealed())).to.be.false;
  });

  it("togglePublicMinting, togglePreSaleLive, togglePublicSaleLive and toggleReveal call by non-owner account should fail", async function () {
    const [owner,addr1] = await ethers.getSigners();
    await expect((waveFormsNFT.connect(addr1).togglePrivateSaleLive())).to.be.revertedWith("Ownable: caller is not the owner");
    await expect((waveFormsNFT.connect(addr1).togglePreSaleLive())).to.be.revertedWith("Ownable: caller is not the owner");
    await expect((waveFormsNFT.connect(addr1).togglePublicSaleLive())).to.be.revertedWith("Ownable: caller is not the owner");
    await expect((waveFormsNFT.connect(addr1).toggleReveal())).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Private Minting should be failed if privateSaleLive is false", async function () {
    const [owner,addr1] = await ethers.getSigners();
    await expect((waveFormsNFT.connect(_accountList[0]).privateSaleMint(5,signatures[0]))).to.be.revertedWith("Private-Sale Closed");
  });

  it("Make privateSaleLive to true successfully", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(owner).togglePrivateSaleLive())).to.be.ok;
    expect((await waveFormsNFT.connect(addr1).privateSaleLive())).to.be.true;
  });

  it("Private Minting should be successfull for 20 token", async function () {
    const [owner,addr1] = await ethers.getSigners();
    //console.log("account 0 = ",_accountList[0]);
    //console.log("signature 0 = ",signatures[0]);
    expect((await waveFormsNFT.connect(_accountList[0]).privateSaleMint(20,signatures[0]))).to.be.ok;
  });

  it("privateSaleMinted = 20, preSaleMinted, publicSaleMinted, teamClaimMinted and treasuryMinted should zero", async function () {
    const [owner,addr1] = await ethers.getSigners();
    expect((await waveFormsNFT.connect(addr1).privateSaleMinted())).to.be.equal(20);
    expect((await waveFormsNFT.connect(addr1).preSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).publicSaleMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).teamClaimMinted())).to.be.equal(0);
    expect((await waveFormsNFT.connect(addr1).treasuryMinted())).to.be.equal(0);
  });

  it("Private Minting should be successfull for 980 token", async function () {
    const [owner,addr1] = await ethers.getSigners();
    for(let i=1;i<_accountList.length;i++) {
      expect((await waveFormsNFT.connect(_accountList[i]).privateSaleMint(20,signatures[i]))).to.be.ok;
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

  it("Private Minting should be failed because all allocated token minted", async function () {
    const [owner,addr1] = await ethers.getSigners();
    await expect((waveFormsNFT.connect(_accountList[0]).privateSaleMint(1,signatures[0]))).to.be.revertedWith("Private-Sale Quota will Exceed");
  });
});
