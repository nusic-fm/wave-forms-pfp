// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import './ERC721Z.sol';

contract WaveFormsNFT is ERC721Z, Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    uint256 public constant PRIVATE_SALE_MAX = 1000;
    uint256 public constant PRESALE_MAX = 3000;
    uint256 public constant PUBLIC_SALE_MAX = 5000;
    uint256 public constant TEAM_CLAIM_MAX = 500;
    uint256 public constant TREASURY_MAX = 500;

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PER_TXT = 50; // Mint per Transaction
    uint256 public constant MINT_PER_ADDR = 25; // Mint per Address
    
    uint256 public price = 0.08 ether;

    uint256 public privateSaleMinted;
    uint256 public preSaleMinted;
    uint256 public publicSaleMinted;
    uint256 public teamClaimMinted;
    uint256 public treasuryMinted;

    bool public privateSaleLive = false;
    bool public preSaleLive = false;
    bool public publicSaleLive = false;
    bool public revealed = false;

    // URI to be used before Reveal
    string public defaultURI;
    string public baseURI;

    address public treasuryAddress;
    address public managerAddress;

    event PrivateSaleMinted(address indexed to, uint256 tokenQuantity, uint256 amountTransfered);
    event PreSaleMinted(address indexed to, uint256 tokenQuantity, uint256 amountTransfered);
    event PublicSaleMinted(address indexed to, uint256 tokenQuantity, uint256 amountTransfered);
    event TeamClaimMinted(address indexed to, uint256 tokenQuantity);
    event TreasuryMinted(address indexed to, uint256 tokenQuantity);

    constructor(string memory _defaultURI) ERC721Z("NUSIC", "NPFP") {
        defaultURI = _defaultURI;
        treasuryAddress = msg.sender;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory URI) public onlyOwner {
		baseURI = URI;
	}

    function setDefaultRI(string memory _defaultURI) public onlyOwner {
		defaultURI = _defaultURI;
	}

    function togglePrivateSaleLive() public onlyOwner{
        privateSaleLive = !privateSaleLive;
    }

    function togglePreSaleLive() public onlyOwner{
        preSaleLive = !preSaleLive;
    }

    function togglePublicSaleLive() public onlyOwner{
        publicSaleLive = !publicSaleLive;
    }

    function toggleReveal() public onlyOwner {
        revealed = !revealed;
    }

    function setPrice(uint256 newPrice) public onlyOwner {
        require(newPrice > 0, "Price can not be zero");
        price = newPrice;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exists");
        if(revealed == false) {
            return defaultURI;
        }
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(),".json")) : "";
    }

    modifier mintPerTxtNotExceed(uint256 tokenQuantity) {
		require(tokenQuantity <= MINT_PER_TXT, 'Exceed Per Txt limit');
		_;
	}
    modifier mintPerAddressNotExceed(uint256 tokenQuantity) {
		require(balanceOf(msg.sender) + tokenQuantity <= MINT_PER_ADDR, 'Exceed Per Address limit');
		_;
	}

    function preSaleMint(uint256 tokenQuantity, bytes calldata signature) public payable mintPerTxtNotExceed(tokenQuantity) mintPerAddressNotExceed(tokenQuantity) {
        require(preSaleLive && !publicSaleLive, "Pre-Sale Closed"); // Pre-Sale should be active
        require((preSaleMinted + tokenQuantity) <= PRESALE_MAX, "Pre-Sale Quota will Exceed"); // Total Pre-Sale minted should not exceed Max Pre-Sale allocated
        require(totalSupply() + tokenQuantity <= MAX_SUPPLY, "Minting would exceed max supply"); // Total Minted should not exceed Max Supply
        require((price * tokenQuantity) == msg.value, "Insufficient Funds Sent" ); // Amount sent should be equal to price to quantity being minted

        bytes32 msgHash = keccak256(abi.encodePacked(msg.sender));
        bytes32 signedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        require(owner() == signedHash.recover(signature), "Signer address mismatch.");

        _safeMint(msg.sender, tokenQuantity);
        preSaleMinted+=tokenQuantity;

        emit PreSaleMinted(msg.sender, tokenQuantity, msg.value);
    }

    function mint(uint256 tokenQuantity) public payable mintPerTxtNotExceed(tokenQuantity) mintPerAddressNotExceed(tokenQuantity) {
        require(publicSaleLive, "Public Sale Closed"); // Public Sale Should be active
        require(totalSupply() < MAX_SUPPLY, "All tokens have been minted");
        require(totalSupply() + tokenQuantity <= MAX_SUPPLY, "Minting would exceed max supply"); // Total Minted should not exceed Max Supply
        require((price * tokenQuantity) == msg.value, "Insufficient Funds Sent" ); // Amount sent should be equal to price to quantity being minted

        _safeMint(msg.sender, tokenQuantity);
        publicSaleMinted+=tokenQuantity;
        
        emit PublicSaleMinted(msg.sender, tokenQuantity, msg.value);
    }

}