// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract myERC20 is OwnableUpgradeable, ERC20Upgradeable/*, UUPSUpgradeable*/ {
    using SafeMathUpgradeable for uint256;

    function initialize(uint256 _initialSupply) public initializer {
        OwnableUpgradeable.__Ownable_init();
        ERC20Upgradeable.__ERC20_init_unchained("NewJNT", "NJNT");
        _mint(msg.sender, _initialSupply.mul(uint(1e18)));
    }

}
