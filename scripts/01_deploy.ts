import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { WaveFormsNFT, WaveFormsNFT__factory } from '../typechain';

/*
* Main deployment script to deploy all the relevent contracts
*/
async function main() {
  const [owner, add1] = await ethers.getSigners();

  const WaveFormsNFT:WaveFormsNFT__factory = await ethers.getContractFactory("WaveFormsNFT");
  const waveFormsNFT:WaveFormsNFT = await WaveFormsNFT.deploy("ipfs://QmXsMLpKjznF3z1KsVm5tNs3E94vj4BFAyAHvD5RTWgQ1J/");
  await waveFormsNFT.deployed();

  console.log("WaveFormsNFT deployed to:", waveFormsNFT.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
