import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { WaveFormsNFT, WaveFormsNFT__factory } from '../typechain';

/*
* Main deployment script to deploy all the relevent contracts
*/
async function main() {
  const [owner, add1] = await ethers.getSigners();

  const WaveFormsNFT:WaveFormsNFT__factory = await ethers.getContractFactory("WaveFormsNFT");
  const waveFormsNFT:WaveFormsNFT = await WaveFormsNFT.attach("0xCbB5cb1e0F37a464Ae779a32517173C5cA37F3a2");

  console.log("WaveFormsNFT Address:", waveFormsNFT.address);

  const amount = ethers.utils.parseEther("0.16")
  const txt = await waveFormsNFT.mint(2, {value:amount});
  console.log("mint txt.hash = ",txt.hash);
  const txtReceipt = await txt.wait();
  console.log("mint txt.hash = ",txtReceipt);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
