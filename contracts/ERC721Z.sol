// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Z is ERC721A, Ownable {
    
    mapping(address => bool) internal frozenAddresses;
    mapping(uint256 => bool) internal frozenTokens;

    event TokensFrozen(uint256 indexed _tokenId);
    event TokensUnfrozen(uint256 indexed _tokenId);
    event AddressFrozen(address indexed _userAddress, bool indexed _isFrozen, address indexed _owner);

    constructor(string memory name_, string memory symbol_) ERC721A(name_, symbol_) {
    }

    function freezeTokens(uint256[] memory _tokenIds) public virtual onlyOwner {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            require(_exists(_tokenIds[i]), "ERC721Z: Query for nonexistent token");
            frozenTokens[_tokenIds[i]] = true;
            emit TokensFrozen(_tokenIds[i]);
        }
    }

    function unfreezeTokens(uint256[] memory _tokenIds) public virtual onlyOwner {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            require(_exists(_tokenIds[i]), "ERC721Z: Query for nonexistent token");
            frozenTokens[_tokenIds[i]] = false;
            emit TokensUnfrozen(_tokenIds[i]);
        }
    }

    function forcedTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) public virtual onlyOwner returns (bool) {
        bool tokenFrozen = frozenTokens[_tokenId];
        if (tokenFrozen) {
            frozenTokens[_tokenId] = false;
            emit TokensUnfrozen(_tokenId);
            transferFrom(_from, _to, _tokenId);
            return true;
        }
        revert('Transfer not possible');
    }

    function setAddressFrozen(address _userAddress, bool _freeze) public virtual onlyOwner {
        frozenAddresses[_userAddress] = _freeze;
        emit AddressFrozen(_userAddress, _freeze, msg.sender);
    }

    function isFrozenAddress(address _userAddress) external view virtual returns (bool) {
        return frozenAddresses[_userAddress];
    }

    function isFrozenToken(uint256 _tokenId) external view virtual returns (bool) {
        return frozenTokens[_tokenId];
    }
    
}