// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IJTrancheTokens.sol";
import "./interfaces/IJCream.sol";


contract JTrancheAToken is ERC20, AccessControl, Ownable, IJTrancheTokens {
	using SafeMath for uint256;

	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
	address public jCreamAddress;
	uint256 public protTrancheNum;

	constructor(string memory name, string memory symbol, uint256 _trNum) ERC20(name, symbol) {
		protTrancheNum = _trNum;
		// Grant the minter role to a specified account
        _setupRole(MINTER_ROLE, msg.sender);
	}

    function setJCreamMinter(address _jCream) external onlyOwner {
		jCreamAddress = _jCream;
		// Grant the minter role to a specified account
        _setupRole(MINTER_ROLE, _jCream);
	}

	/**
	 * @dev mints tokens to an account.
	 * Update pointsCorrection to keep funds unchanged.
	 * @param account The account that will receive the created tokens.
	 * @param value The amount that will be created.
	 */
	function mint(address account, uint256 value) external override {
		require(hasRole(MINTER_ROLE, msg.sender), "JTrancheA: caller is not a minter");
		require(value > 0, "JTrancheA: value is zero");
		super._mint(account, value);
    }
	
	/** 
	 * @dev Internal function that burns an amount of the token of a given account.
	 * Update pointsCorrection to keep funds unchanged.
	 * @param value The amount that will be burnt.
	 */
	function burn(uint256 value) external override {
		require(hasRole(MINTER_ROLE, msg.sender), "JTrancheA: caller cannot burn tokens");
		require(value > 0, "JTrancheA: value is zero");
		super._burn(msg.sender, value);
	}

}