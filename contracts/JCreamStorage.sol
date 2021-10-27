// SPDX-License-Identifier: MIT
/**
 * Created on 2021-01-16
 * @summary: Jibrel Protocol Storage
 * @author: Jibrel Team
 */
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/ICEth.sol";
import "./interfaces/IETHGateway.sol";

contract JCreamStorage is OwnableUpgradeable {
/* WARNING: NEVER RE-ORDER VARIABLES! Always double-check that new variables are added APPEND-ONLY. Re-ordering variables can permanently BREAK the deployed proxy contract.*/
    uint256 public constant PERCENT_DIVIDER = 10000;  // percentage divider
    uint256 public constant SECONDS_PER_YEAR = 31557600;  // 60 sec * 60 min * 24 h * 365.25 d (leap years included)

    struct TrancheAddresses {
        address buyerCoinAddress;       // ETH (ZERO_ADDRESS) or DAI
        address crTokenAddress;         // crETH or crDAI
        address ATrancheAddress;
        address BTrancheAddress;
    }

    struct TrancheParameters {
        uint256 trancheAFixedPercentage;    // fixed percentage (i.e. 4% = 0.04 * 10^18 = 40000000000000000)
        uint256 trancheALastActionTime;
        uint256 storedTrancheAPrice;
        uint256 trancheACurrentRPS;
        uint16 redemptionPercentage;        // percentage with 2 decimals (divided by 10000, i.e. 95% is 9500)
        uint8 crTokenDecimals;
        uint8 underlyingDecimals;
    }

    
    struct StakingDetails {
        uint256 startTime;
        uint256 amount;
    }

    address public adminToolsAddress;
    address public feesCollectorAddress;
    address public tranchesDeployerAddress;
    address public creamTokenAddress;
    address public creamtrollerAddress;

    uint256 public tranchePairsCounter; 
    uint32 public redeemTimeout;

    mapping(address => address) public crTokenContracts;
    mapping(uint256 => TrancheAddresses) public trancheAddresses;
    mapping(uint256 => TrancheParameters) public trancheParameters;
    // last block number when the user buy/reddem tranche tokens
    mapping(address => uint256) public lastActivity;

    ICEth public crEthToken;
    IETHGateway public ethGateway;

    // enabling / disabling tranches for fund deposit
    mapping(uint256 => bool) public trancheDepositEnabled;

    address public incentivesControllerAddress;

    // user => trancheNum => counter
    mapping (address => mapping(uint256 => uint256)) public stakeCounterTrA;
    mapping (address => mapping(uint256 => uint256)) public stakeCounterTrB;
    // user => trancheNum => stakeCounter => struct
    mapping (address => mapping (uint256 => mapping (uint256 => StakingDetails))) public stakingDetailsTrancheA;
    mapping (address => mapping (uint256 => mapping (uint256 => StakingDetails))) public stakingDetailsTrancheB;
}