// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "erc721a/contracts/ERC721A.sol";

contract ERC721Z is ERC721A {
    
    constructor(string memory name_, string memory symbol_) ERC721A(name_, symbol_) {
    }
}