import { BigNumber } from '@ethersproject/bignumber';
import { Wallet } from '@ethersproject/wallet';
import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import { WaveFormsNFT, WaveFormsNFT__factory } from '../typechain';
var crypto = require('crypto');

describe("Nusic Wave Forms NFT Deployed: Before any Sales round started", function () {

  let waveFormsNFT:WaveFormsNFT;
  let _accountList:Wallet[] = [];
  before(async()=>{
    const [owner,addr1] = await ethers.getSigners();

    const WaveFormsNFT:WaveFormsNFT__factory =  await ethers.getContractFactory("WaveFormsNFT");
    waveFormsNFT = await WaveFormsNFT.deploy("ipfs://QmXsMLpKjznF3z1KsVm5tNs3E94vj4BFAyAHvD5RTWgQ1J");
    await waveFormsNFT.deployed(); 
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
    expect((await waveFormsNFT.connect(addr1).MINT_PER_ADDR())).to.be.equal(25);
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

});
