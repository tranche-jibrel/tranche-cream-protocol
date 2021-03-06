// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IJTrancheTokens.sol";
import "./interfaces/IJCream.sol";
import "./interfaces/IIncentivesController.sol";

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
	 * @dev Internal function that transfer tokens from one address to another.
	 * Update pointsCorrection to keep funds unchanged.
	 * @param from The address to transfer from.
	 * @param to The address to transfer to.
	 * @param value The amount to be transferred.
	 */
	function _transfer(address from, address to, uint256 value) internal override {
		// moving SIR rewards in protocol
		// claim and transfer rewards before transfer tokens. Be sure to wait for this function to be completed! 
		address incentivesControllerAddress = IJCream(jCreamAddress).getSirControllerAddress();
        bool rewClaimCompleted = IIncentivesController(incentivesControllerAddress).claimRewardsAllMarkets(from);
		// decrease tokens after claiming rewards
        if (rewClaimCompleted && value > 0) {
			uint256 tempTime;
			uint256 tempAmount;
			uint256 tempValue = value;
			uint256 stkDetNum = IJCream(jCreamAddress).getSingleTrancheUserStakeCounterTrA(from, protTrancheNum);
			for (uint256 i = 1; i<= stkDetNum; i++){
				(tempTime, tempAmount) = IJCream(jCreamAddress).getSingleTrancheUserSingleStakeDetailsTrA(from, protTrancheNum, protTrancheNum);
				if (tempAmount > 0) {
					if (tempAmount <= tempValue) {
						IJCream(jCreamAddress).setTrAStakingDetails(protTrancheNum, from, i, 0, tempTime);
						IJCream(jCreamAddress).setTrAStakingDetails(protTrancheNum, to, i, tempAmount, block.timestamp);
						tempValue = tempValue.sub(tempAmount);
					} else {
						uint256 remainingAmount = tempAmount.sub(tempValue);
						IJCream(jCreamAddress).setTrAStakingDetails(protTrancheNum, from, i, remainingAmount, tempTime);
						IJCream(jCreamAddress).setTrAStakingDetails(protTrancheNum, to, i, tempValue, block.timestamp);
						tempValue = 0;
					}
				}
				if (tempValue == 0)
                break;
			}
		}
		super._transfer(from, to, value);
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