// SPDX-License-Identifier: MIT
/**
 * Created on 2021-02-11
 * @summary: Jibrel cream Tranche Protocol
 * @author: Jibrel Team
 */
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IJAdminTools.sol";
import "./interfaces/IJTrancheTokens.sol";
import "./interfaces/IJTranchesDeployer.sol";
import "./interfaces/IJCream.sol";
import "./interfaces/ICErc20.sol";
import "./interfaces/IComptrollerInterface.sol";
import "./JCreamStorage.sol";
import "./TransferETHHelper.sol";
import "./interfaces/IIncentivesController.sol";


contract JCream is OwnableUpgradeable, ReentrancyGuardUpgradeable, JCreamStorage, IJCream {
    using SafeMathUpgradeable for uint256;

    /**
     * @dev contract initializer
     * @param _adminTools price oracle address
     * @param _feesCollector fees collector contract address
     * @param _tranchesDepl tranches deployer contract address
     * @param _creamTokenAddress COMP token contract address
     * @param _creamtrollAddress comptroller contract address
     */
    function initialize(address _adminTools, 
            address _feesCollector, 
            address _tranchesDepl,
            address _creamTokenAddress,
            address _creamtrollAddress) external initializer() {
        OwnableUpgradeable.__Ownable_init();
        adminToolsAddress = _adminTools;
        feesCollectorAddress = _feesCollector;
        tranchesDeployerAddress = _tranchesDepl;
        creamTokenAddress = _creamTokenAddress;
        creamtrollerAddress = _creamtrollAddress;
        redeemTimeout = 3; //default
    }

    /**
     * @dev admins modifiers
     */
    modifier onlyAdmins() {
        require(IJAdminTools(adminToolsAddress).isAdmin(msg.sender), "Jcream: not an Admin");
        _;
    }

    // This is needed to receive ETH
    fallback() external payable {}
    receive() external payable {}

    /**
     * @dev set new addresses for price oracle, fees collector and tranche deployer 
     * @param _adminTools price oracle address
     * @param _feesCollector fees collector contract address
     * @param _tranchesDepl tranches deployer contract address
     * @param _creamTokenAddress COMP token contract address
     * @param _creamtrollAddress comptroller contract address
     */
    function setNewEnvironment(address _adminTools, 
            address _feesCollector, 
            address _tranchesDepl,
            address _creamTokenAddress,
            address _creamtrollAddress) external onlyOwner {
        require((_adminTools != address(0)) && (_feesCollector != address(0)) && (_tranchesDepl != address(0)) && 
                (_creamtrollAddress != address(0)) && (_creamTokenAddress != address(0)), "Jcream: check addresses");
        adminToolsAddress = _adminTools;
        feesCollectorAddress = _feesCollector;
        tranchesDeployerAddress = _tranchesDepl;
        creamTokenAddress = _creamTokenAddress;
        creamtrollerAddress = _creamtrollAddress;
    }

    /**
     * @dev set eth gateway 
     * @param _ethGateway ethGateway address
     */
    function setETHGateway(address _ethGateway) external onlyAdmins {
        ethGateway = IETHGateway(_ethGateway);
    }

    /**
     * @dev set relationship between ethers and the corresponding Cream cETH contract
     * @param _cEtherContract cream token contract address 
     */
    function setCrEtherContract(address _cEtherContract) external onlyAdmins {
        crEthToken = ICEth(_cEtherContract);
        crTokenContracts[address(0)] = _cEtherContract;
    }

    /**
     * @dev set relationship between a token and the corresponding cream crToken contract
     * @param _erc20Contract token contract address 
     * @param _cErc20Contract cream token contract address 
     */
    function setCrTokenContract(address _erc20Contract, address _cErc20Contract) external onlyAdmins {
        crTokenContracts[_erc20Contract] = _cErc20Contract;
    }

    /**
     * @dev check if a crToken is allowed or not
     * @param _erc20Contract token contract address
     * @return true or false
     */
    function isCrTokenAllowed(address _erc20Contract) public view returns (bool) {
        return crTokenContracts[_erc20Contract] != address(0);
    }

    /**
     * @dev get RPB from cream token
     * @param _trancheNum tranche number
     * @return crToken cream supply RPB
     */
    function getCreamSupplyRPB(uint256 _trancheNum) external view returns (uint256) {
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            return crEthToken.supplyRatePerBlock();
        } else {
            ICErc20 crToken = ICErc20(crTokenContracts[trancheAddresses[_trancheNum].buyerCoinAddress]);
            return crToken.supplyRatePerBlock();
        }
    }

    /**
     * @dev set incentive rewards address
     * @param _incentivesController incentives controller contract address
     */
    function setincentivesControllerAddress(address _incentivesController) external onlyAdmins {
        incentivesControllerAddress = _incentivesController;
    }

    /**
     * @dev get incentive rewards address
     */
    function getSirControllerAddress() external view override returns (address) {
        return incentivesControllerAddress;
    }

    /**
     * @dev set decimals for tranche tokens
     * @param _trancheNum tranche number
     * @param _crTokenDec crToken decimals
     * @param _underlyingDec underlying token decimals
     */
    function setDecimals(uint256 _trancheNum, uint8 _crTokenDec, uint8 _underlyingDec) external onlyAdmins {
        require((_crTokenDec <= 18) && (_underlyingDec <= 18), "Jcream: too many decimals");
        trancheParameters[_trancheNum].crTokenDecimals = _crTokenDec;
        trancheParameters[_trancheNum].underlyingDecimals = _underlyingDec;
    }

    /**
     * @dev set tranche redemption percentage
     * @param _trancheNum tranche number
     * @param _redeemPercent user redemption percent
     */
    function setTrancheRedemptionPercentage(uint256 _trancheNum, uint16 _redeemPercent) external onlyAdmins {
        trancheParameters[_trancheNum].redemptionPercentage = _redeemPercent;
    }

    /**
     * @dev set tranche A fixed percentage (scaled by 1e18)
     * @param _trancheNum tranche number
     * @param _newTrAPercentage new tranche A fixed percentage (scaled by 1e18)
     */
    function setTrancheAFixedPercentage(uint256 _trancheNum, uint256 _newTrAPercentage) external onlyAdmins {
        trancheParameters[_trancheNum].trancheAFixedPercentage = _newTrAPercentage;
        trancheParameters[_trancheNum].storedTrancheAPrice = setTrancheAExchangeRate(_trancheNum);
    }

    /**
     * @dev set redemption timeout
     * @param _blockNum timeout (in block numbers)
     */
    function setRedemptionTimeout(uint32 _blockNum) external onlyAdmins {
        redeemTimeout = _blockNum;
    }

    /**
     * @dev add tranche in protocol
     * @param _erc20Contract token contract address (0x0000000000000000000000000000000000000000 if eth)
     * @param _nameA tranche A token name
     * @param _symbolA tranche A token symbol
     * @param _nameB tranche B token name
     * @param _symbolB tranche B token symbol
     * @param _fixPercentage tranche A percentage fixed compounded interest per year
     * @param _crTokenDec crToken decimals
     * @param _underlyingDec underlying token decimals
     */
    function addTrancheToProtocol(address _erc20Contract, 
            string memory _nameA, 
            string memory _symbolA, 
            string memory _nameB, 
            string memory _symbolB, 
            uint256 _fixPercentage, 
            uint8 _crTokenDec, 
            uint8 _underlyingDec) external onlyAdmins nonReentrant {
        require(tranchesDeployerAddress != address(0), "JCream: set tranche eth deployer");
        require(isCrTokenAllowed(_erc20Contract), "JCream: crToken not allowed");

        trancheAddresses[tranchePairsCounter].buyerCoinAddress = _erc20Contract;
        trancheAddresses[tranchePairsCounter].crTokenAddress = crTokenContracts[_erc20Contract];
        // our tokens always with 18 decimals
        trancheAddresses[tranchePairsCounter].ATrancheAddress = 
                IJTranchesDeployer(tranchesDeployerAddress).deployNewTrancheATokens(_nameA, _symbolA, tranchePairsCounter);
        trancheAddresses[tranchePairsCounter].BTrancheAddress = 
                IJTranchesDeployer(tranchesDeployerAddress).deployNewTrancheBTokens(_nameB, _symbolB, tranchePairsCounter);
        
        trancheParameters[tranchePairsCounter].crTokenDecimals = _crTokenDec;
        trancheParameters[tranchePairsCounter].underlyingDecimals = _underlyingDec;
        trancheParameters[tranchePairsCounter].trancheAFixedPercentage = _fixPercentage;
        trancheParameters[tranchePairsCounter].trancheALastActionTime = block.timestamp;
        // if we would like to have always 18 decimals
        trancheParameters[tranchePairsCounter].storedTrancheAPrice = getCreamPrice(tranchePairsCounter);

        trancheParameters[tranchePairsCounter].redemptionPercentage = 10000;  //default value 100%

        // add tokens in adminTools contracts so they can change staking details
        IJAdminTools(adminToolsAddress).addAdmin(trancheAddresses[tranchePairsCounter].ATrancheAddress);
        IJAdminTools(adminToolsAddress).addAdmin(trancheAddresses[tranchePairsCounter].BTrancheAddress);

        calcRPBFromPercentage(tranchePairsCounter); // initialize tranche A RPB

        emit TrancheAddedToProtocol(tranchePairsCounter, trancheAddresses[tranchePairsCounter].ATrancheAddress, trancheAddresses[tranchePairsCounter].BTrancheAddress);

        tranchePairsCounter = tranchePairsCounter.add(1);
    } 

    /**
     * @dev enables or disables tranche deposit (default: disabled)
     * @param _trancheNum tranche number
     * @param _enable true or false
     */
    function setTrancheDeposit(uint256 _trancheNum, bool _enable) external onlyAdmins {
        trancheDepositEnabled[_trancheNum] = _enable;
    }

    /**
     * @dev send an amount of tokens to corresponding cream contract (it takes tokens from this contract). Only allowed token should be sent
     * @param _erc20Contract token contract address
     * @param _numTokensToSupply token amount to be sent
     * @return mint result
     */
    function sendErc20ToCream(address _erc20Contract, uint256 _numTokensToSupply) internal returns(uint256) {
        require(crTokenContracts[_erc20Contract] != address(0), "JCream: token not accepted");
        // i.e. DAI contract, on Kovan: 0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa
        IERC20Upgradeable underlying = IERC20Upgradeable(_erc20Contract);

        // i.e. cDAI contract, on Kovan: 0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad
        ICErc20 crToken = ICErc20(crTokenContracts[_erc20Contract]);

        SafeERC20Upgradeable.safeApprove(underlying, crTokenContracts[_erc20Contract], _numTokensToSupply);
        require(underlying.allowance(address(this), crTokenContracts[_erc20Contract]) >= _numTokensToSupply, "JCream: cannot send to cream contract");

        uint256 mintResult = crToken.mint(_numTokensToSupply);
        return mintResult;
    }

    /**
     * @dev redeem an amount of crTokens to have back original tokens (tokens remains in this contract). Only allowed token should be sent
     * @param _erc20Contract original token contract address
     * @param _amount crToken amount to be sent
     * @param _redeemType true or false, normally true
     */
    function redeemCErc20Tokens(address _erc20Contract, uint256 _amount, bool _redeemType) internal returns (uint256 redeemResult) {
        require(crTokenContracts[_erc20Contract] != address(0), "token not accepted");
        // i.e. cDAI contract, on Kovan: 0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad
        ICErc20 crToken = ICErc20(crTokenContracts[_erc20Contract]);

        if (_redeemType) {
            // Retrieve your asset based on a crToken amount
            redeemResult = crToken.redeem(_amount);
        } else {
            // Retrieve your asset based on an amount of the asset
            redeemResult = crToken.redeemUnderlying(_amount);
        }
        return redeemResult;
    }

    /**
     * @dev get cETH stored exchange rate from cream contract
     * @return exchRateMantissa exchange rate cEth mantissa
     */
    function getCEthExchangeRate() public view returns (uint256 exchRateMantissa) {
        // Amount of current exchange rate from crToken to underlying
        return exchRateMantissa = crEthToken.exchangeRateStored(); // it returns something like 200335783821833335165549849
    }

    /**
     * @dev get cETH stored exchange rate from cream contract
     * @param _tokenContract tranche number
     * @return exchRateMantissa exchange rate crToken mantissa
     */
    function getCrTokenExchangeRate(address _tokenContract) public view returns (uint256 exchRateMantissa) {
        ICErc20 crToken = ICErc20(crTokenContracts[_tokenContract]);
        // Amount of current exchange rate from crToken to underlying
        return exchRateMantissa = crToken.exchangeRateStored(); // it returns something like 210615675702828777787378059 (cDAI contract) or 209424757650257 (cUSDT contract)
    }

    /**
     * @dev get tranche mantissa
     * @param _trancheNum tranche number
     * @return mantissa tranche mantissa (from 16 to 28 decimals)
     */
    function getMantissa(uint256 _trancheNum) public view returns (uint256 mantissa) {
        mantissa = (uint256(trancheParameters[_trancheNum].underlyingDecimals)).add(18).sub(uint256(trancheParameters[_trancheNum].crTokenDecimals));
        return mantissa;
    }

    /**
     * @dev get cream pure price for a single tranche
     * @param _trancheNum tranche number
     * @return creamPrice cream current pure price
     */
    function getCreamPurePrice(uint256 _trancheNum) internal view returns (uint256 creamPrice) {
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            creamPrice = getCEthExchangeRate();
        } else {
            creamPrice = getCrTokenExchangeRate(trancheAddresses[_trancheNum].buyerCoinAddress);
        }
        return creamPrice;
    }

    /**
     * @dev get cream price for a single tranche scaled by 1e18
     * @param _trancheNum tranche number
     * @return creamNormPrice cream current normalized price
     */
    function getCreamPrice(uint256 _trancheNum) public view returns (uint256 creamNormPrice) {
        creamNormPrice = getCreamPurePrice(_trancheNum);

        uint256 mantissa = getMantissa(_trancheNum);
        if (mantissa < 18) {
            creamNormPrice = creamNormPrice.mul(10 ** (uint256(18).sub(mantissa)));
        } else {
            creamNormPrice = creamNormPrice.div(10 ** (mantissa.sub(uint256(18))));
        }
        return creamNormPrice;
    }

    /**
     * @dev set Tranche A exchange rate
     * @param _trancheNum tranche number
     * @return tranche A token stored price
     */
    function setTrancheAExchangeRate(uint256 _trancheNum) internal returns (uint256) {
        calcRPBFromPercentage(_trancheNum);
        uint256 deltaTime = (block.timestamp).sub(trancheParameters[_trancheNum].trancheALastActionTime);
        if (deltaTime > 0) {
            uint256 deltaPrice = (trancheParameters[_trancheNum].trancheACurrentRPS).mul(deltaTime);
            trancheParameters[_trancheNum].storedTrancheAPrice = (trancheParameters[_trancheNum].storedTrancheAPrice).add(deltaPrice);
            trancheParameters[_trancheNum].trancheALastActionTime = block.timestamp;
        }
        return trancheParameters[_trancheNum].storedTrancheAPrice;
    }

    /**
     * @dev get Tranche A exchange rate
     * @param _trancheNum tranche number
     * @return tranche A token stored price
     */
    function getTrancheAExchangeRate(uint256 _trancheNum) public view returns (uint256) {
        return trancheParameters[_trancheNum].storedTrancheAPrice;
    }

    /**
     * @dev get RPS for a given percentage (expressed in 1e18)
     * @param _trancheNum tranche number
     * @return RPS for a fixed percentage
     */
    function getTrancheACurrentRPS(uint256 _trancheNum) external view returns (uint256) {
        return trancheParameters[_trancheNum].trancheACurrentRPS;
    }

    /**
     * @dev set Tranche A RPS (scaled by 18 decimals)
     * @param _trancheNum tranche number
     * @return tranche A RPS
     */
    function calcRPBFromPercentage(uint256 _trancheNum) public returns (uint256) {
        trancheParameters[_trancheNum].trancheACurrentRPS = (trancheParameters[_trancheNum].trancheAFixedPercentage).div(SECONDS_PER_YEAR).div(1e18);
        return trancheParameters[_trancheNum].trancheACurrentRPS;
    }

    /**
     * @dev get Tranche A value in underlying tokens
     * @param _trancheNum tranche number
     * @return trANormValue tranche A value in underlying tokens
     */
    function getTrAValue(uint256 _trancheNum) public view returns (uint256 trANormValue) {
        uint256 totASupply = IERC20Upgradeable(trancheAddresses[_trancheNum].ATrancheAddress).totalSupply();
        uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
        if (diffDec > 0)
            trANormValue = totASupply.mul(getTrancheAExchangeRate(_trancheNum)).div(1e18).div(10 ** diffDec);
        else    
            trANormValue = totASupply.mul(getTrancheAExchangeRate(_trancheNum)).div(1e18);
        return trANormValue;
    }

    /**
     * @dev get Tranche B value in underlying tokens
     * @param _trancheNum tranche number
     * @return tranche B valuein underlying tokens
     */
    function getTrBValue(uint256 _trancheNum) external view returns (uint256) {
        uint256 totProtValue = getTotalValue(_trancheNum);
        uint256 totTrAValue = getTrAValue(_trancheNum);
        if (totProtValue > totTrAValue) {
            return totProtValue.sub(totTrAValue);
        } else
            return 0;
    }

    /**
     * @dev get Tranche total value in underlying tokens
     * @param _trancheNum tranche number
     * @return tranche total value in underlying tokens
     */
    function getTotalValue(uint256 _trancheNum) public view returns (uint256) {
        uint256 creamNormPrice = getCreamPrice(_trancheNum);
        uint256 mantissa = getMantissa(_trancheNum);
        if (mantissa < 18) {
            creamNormPrice = creamNormPrice.div(10 ** (uint256(18).sub(mantissa)));
        } else {
            creamNormPrice = getCreamPurePrice(_trancheNum);
        }
        uint256 totProtSupply = getTokenBalance(trancheAddresses[_trancheNum].crTokenAddress);
        return totProtSupply.mul(creamNormPrice).div(1e18);
    }

    /**
     * @dev get Tranche B exchange rate
     * @param _trancheNum tranche number
     * @return tbPrice tranche B token current price
     */
    function getTrancheBExchangeRate(uint256 _trancheNum) public view returns (uint256 tbPrice) {
        // set amount of tokens to be minted via taToken price
        // Current tbDai price = (((cDai X cPrice)-(aSupply X taPrice)) / bSupply)
        // where: cDai = How much cDai we hold in the protocol
        // cPrice = cDai / Dai price
        // aSupply = Total number of taDai in protocol
        // taPrice = taDai / Dai price
        // bSupply = Total number of tbDai in protocol
        uint256 totBSupply = IERC20Upgradeable(trancheAddresses[_trancheNum].BTrancheAddress).totalSupply(); // 18 decimals
        if (totBSupply > 0) {
            uint256 totProtValue = getTotalValue(_trancheNum); //underlying token decimals
            uint256 totTrAValue = getTrAValue(_trancheNum); //underlying token decimals
            uint256 totTrBValue = totProtValue.sub(totTrAValue); //underlying token decimals
            // if normalized price in tranche A price, everything should be scaled to 1e18 
            uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
            totTrBValue = totTrBValue.mul(10 ** diffDec);
            tbPrice = totTrBValue.mul(1e18).div(totBSupply);
        } else {
            tbPrice = uint256(1e18);
        }
        return tbPrice;
    }

     
    /**
     * @dev set staking details for tranche A holders, with number, amount and time
     * @param _trancheNum tranche number
     * @param _account user's account
     * @param _stkNum staking detail counter
     * @param _amount amount of tranche A tokens
     * @param _time time to be considered the deposit
     */
    function setTrAStakingDetails(uint256 _trancheNum, address _account, uint256 _stkNum, uint256 _amount, uint256 _time) external override onlyAdmins {
        stakeCounterTrA[_account][_trancheNum] = _stkNum;
        StakingDetails storage details = stakingDetailsTrancheA[_account][_trancheNum][_stkNum];
        details.startTime = _time;
        details.amount = _amount;
    }

    /**
     * @dev when redemption occurs on tranche A, removing tranche A tokens from staking information (FIFO logic)
     * @param _trancheNum tranche number
     * @param _amount amount of redeemed tokens
     */
    function decreaseTrancheATokenFromStake(uint256 _trancheNum, uint256 _amount) internal {
        uint256 senderCounter = stakeCounterTrA[msg.sender][_trancheNum];
        uint256 tmpAmount = _amount;
        for (uint i = 1; i <= senderCounter; i++) {
            StakingDetails storage details = stakingDetailsTrancheA[msg.sender][_trancheNum][i];
            if (details.amount > 0) {
                if (details.amount <= tmpAmount) {
                    tmpAmount = tmpAmount.sub(details.amount);
                    details.amount = 0;
                } else {
                    details.amount = details.amount.sub(tmpAmount);
                    tmpAmount = 0;
                }
            }
            if (tmpAmount == 0)
                break;
        }
    }

    function getSingleTrancheUserStakeCounterTrA(address _user, uint256 _trancheNum) external view override returns (uint256) {
        return stakeCounterTrA[_user][_trancheNum];
    }

    function getSingleTrancheUserSingleStakeDetailsTrA(address _user, uint256 _trancheNum, uint256 _num) external view override returns (uint256, uint256) {
        return (stakingDetailsTrancheA[_user][_trancheNum][_num].startTime, stakingDetailsTrancheA[_user][_trancheNum][_num].amount);
    }

    /**
     * @dev set staking details for tranche B holders, with number, amount and time
     * @param _trancheNum tranche number
     * @param _account user's account
     * @param _stkNum staking detail counter
     * @param _amount amount of tranche B tokens
     * @param _time time to be considered the deposit
     */
    function setTrBStakingDetails(uint256 _trancheNum, address _account, uint256 _stkNum, uint256 _amount, uint256 _time) external override onlyAdmins {
        stakeCounterTrB[_account][_trancheNum] = _stkNum;
        StakingDetails storage details = stakingDetailsTrancheB[_account][_trancheNum][_stkNum];
        details.startTime = _time;
        details.amount = _amount; 
    }
    
    /**
     * @dev when redemption occurs on tranche B, removing tranche B tokens from staking information (FIFO logic)
     * @param _trancheNum tranche number
     * @param _amount amount of redeemed tokens
     */
    function decreaseTrancheBTokenFromStake(uint256 _trancheNum, uint256 _amount) internal {
        uint256 senderCounter = stakeCounterTrB[msg.sender][_trancheNum];
        uint256 tmpAmount = _amount;
        for (uint i = 1; i <= senderCounter; i++) {
            StakingDetails storage details = stakingDetailsTrancheB[msg.sender][_trancheNum][i];
            if (details.amount > 0) {
                if (details.amount <= tmpAmount) {
                    tmpAmount = tmpAmount.sub(details.amount);
                    details.amount = 0;
                } else {
                    details.amount = details.amount.sub(tmpAmount);
                    tmpAmount = 0;
                }
            }
            if (tmpAmount == 0)
                break;
        }
    }

    function getSingleTrancheUserStakeCounterTrB(address _user, uint256 _trancheNum) external view override returns (uint256) {
        return stakeCounterTrB[_user][_trancheNum];
    }

    function getSingleTrancheUserSingleStakeDetailsTrB(address _user, uint256 _trancheNum, uint256 _num) external view override returns (uint256, uint256) {
        return (stakingDetailsTrancheB[_user][_trancheNum][_num].startTime, stakingDetailsTrancheB[_user][_trancheNum][_num].amount);
    }

    /**
     * @dev buy Tranche A Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function buyTrancheAToken(uint256 _trancheNum, uint256 _amount) external payable nonReentrant {
        require(trancheDepositEnabled[_trancheNum], "JCream: tranche deposit disabled");
        address origToken = trancheAddresses[_trancheNum].buyerCoinAddress;
        address crToken = trancheAddresses[_trancheNum].crTokenAddress;
        uint256 prevCrTokenBalance = getTokenBalance(crToken);
        if (origToken == address(0)){
            require(msg.value == _amount, "JCream: msg.value not equal to amount");
            //Transfer ETH from msg.sender to protocol;
            TransferETHHelper.safeTransferETH(address(this), _amount);
            // transfer ETH to Coompound receiving cETH
            crEthToken.mint{value: _amount}();
        } else {
            // check approve
            require(IERC20Upgradeable(origToken).allowance(msg.sender, address(this)) >= _amount, "JCream: allowance failed buying tranche A");
            //Transfer DAI from msg.sender to protocol;
            SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(origToken), msg.sender, address(this), _amount);
            // transfer DAI to Coompound receiving cDai
            sendErc20ToCream(origToken, _amount);
        }
        uint256 newCrTokenBalance = getTokenBalance(crToken);
        // set amount of tokens to be minted calculate taToken amount via taToken price
        setTrancheAExchangeRate(_trancheNum);
        uint256 taAmount;
        if (newCrTokenBalance > prevCrTokenBalance) {
            // if normalized price in tranche A price, everything should be scaled to 1e18 
            uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
            uint256 normAmount = _amount.mul(10 ** diffDec);
            taAmount = normAmount.mul(1e18).div(trancheParameters[_trancheNum].storedTrancheAPrice);
            //Mint trancheA tokens and send them to msg.sender;
            IJTrancheTokens(trancheAddresses[_trancheNum].ATrancheAddress).mint(msg.sender, taAmount);
        }

        stakeCounterTrA[msg.sender][_trancheNum] = stakeCounterTrA[msg.sender][_trancheNum].add(1);
        StakingDetails storage details = stakingDetailsTrancheA[msg.sender][_trancheNum][stakeCounterTrA[msg.sender][_trancheNum]];
        details.startTime = block.timestamp;
        details.amount = taAmount;
        
        lastActivity[msg.sender] = block.number;
        emit TrancheATokenMinted(_trancheNum, msg.sender, _amount, taAmount);
    }

    /**
     * @dev redeem Tranche A Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function redeemTrancheAToken(uint256 _trancheNum, uint256 _amount) external nonReentrant {
        require((block.number).sub(lastActivity[msg.sender]) >= redeemTimeout, "JCream: redeem timeout not expired on tranche A");
        // check approve
        // address aTranche = trancheAddresses[_trancheNum].ATrancheAddress;
        require(IERC20Upgradeable(trancheAddresses[_trancheNum].ATrancheAddress).allowance(msg.sender, address(this)) >= _amount, "JCream: allowance failed redeeming tranche A");
        //Transfer aDAI from msg.sender to protocol;
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(trancheAddresses[_trancheNum].ATrancheAddress), msg.sender, address(this), _amount);

        uint256 oldBal;
        uint256 diffBal;
        uint256 userAmount;
        uint256 feesAmount;
        setTrancheAExchangeRate(_trancheNum);

        address origToken = trancheAddresses[_trancheNum].buyerCoinAddress;
        address crToken = trancheAddresses[_trancheNum].crTokenAddress;
        uint16 redeemPerc = trancheParameters[_trancheNum].redemptionPercentage;

        // if normalized price in tranche A price, everything should be scaled to 1e18 
        uint256 taAmount = _amount.mul(trancheParameters[_trancheNum].storedTrancheAPrice).div(1e18);
        uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
        uint256 normAmount = taAmount.div(10 ** diffDec);
        uint256 crTokenBal = getTokenBalance(crToken); // needed for emergency
        if (origToken == address(0)) {
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(crToken), address(ethGateway), crTokenBal);
            // calculate taAmount via cETH price
            oldBal = getEthBalance();
            ethGateway.withdrawETH(normAmount, address(this), false, crTokenBal);
            diffBal = getEthBalance().sub(oldBal);
            userAmount = diffBal.mul(redeemPerc).div(PERCENT_DIVIDER);
            TransferETHHelper.safeTransferETH(msg.sender, userAmount);
            feesAmount = diffBal.sub(userAmount);
            if (diffBal != userAmount && feesAmount > 0) {
                // transfer fees to JFeesCollector
                TransferETHHelper.safeTransferETH(feesCollectorAddress, feesAmount);
            }   
        } else {
            // calculate taAmount via crToken price
            oldBal = getTokenBalance(origToken);
            uint256 creamRetCode = redeemCErc20Tokens(origToken, normAmount, false);
            if(creamRetCode != 0) {
                // emergency: send all crtokens balance to cream 
                redeemCErc20Tokens(origToken, crTokenBal, true);  
            }
            diffBal = getTokenBalance(origToken).sub(oldBal);
            userAmount = diffBal.mul(redeemPerc).div(PERCENT_DIVIDER);
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(origToken), msg.sender, userAmount);
            feesAmount = diffBal.sub(userAmount);
            if (diffBal != userAmount && feesAmount > 0) {
                // transfer fees to JFeesCollector
                SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(origToken), feesCollectorAddress, feesAmount);
            }
        }

        // claim and transfer rewards to msg.sender. Be sure to wait for this function to be completed! 
        bool rewClaimCompleted = IIncentivesController(incentivesControllerAddress).claimRewardsAllMarkets(msg.sender);

        // decrease tokens after claiming rewards
        if (rewClaimCompleted && _amount > 0)
            decreaseTrancheATokenFromStake(_trancheNum, _amount);
     
        IJTrancheTokens(trancheAddresses[_trancheNum].ATrancheAddress).burn(_amount);
        lastActivity[msg.sender] = block.number;
        emit TrancheATokenRedemption(_trancheNum, msg.sender, _amount, userAmount, feesAmount);
    }

    /**
     * @dev buy Tranche B Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function buyTrancheBToken(uint256 _trancheNum, uint256 _amount) external payable nonReentrant {
        require(trancheDepositEnabled[_trancheNum], "JCream: tranche deposit disabled");
        address origToken = trancheAddresses[_trancheNum].buyerCoinAddress;
        address crToken = trancheAddresses[_trancheNum].crTokenAddress;
        uint256 prevCrTokenBalance = getTokenBalance(crToken);
        // if eth, ignore _amount parameter and set it to msg.value
        if (origToken == address(0)) {
            require(msg.value == _amount, "JCream: msg.value not equal to amount");
            //_amount = msg.value;
        }
        // refresh value for tranche A
        setTrancheAExchangeRate(_trancheNum);
        // get tranche B exchange rate
        // if normalized price in tranche B price, everything should be scaled to 1e18 
        uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
        uint256 normAmount = _amount.mul(10 ** diffDec);
        uint256 tbAmount = normAmount.mul(1e18).div(getTrancheBExchangeRate(_trancheNum));
        if (origToken == address(0)) {
            TransferETHHelper.safeTransferETH(address(this), _amount);
            // transfer ETH to Coompound receiving cETH
            crEthToken.mint{value: _amount}();
        } else {
            // check approve
            require(IERC20Upgradeable(origToken).allowance(msg.sender, address(this)) >= _amount, "JCream: allowance failed buying tranche B");
            //Transfer DAI from msg.sender to protocol;
            SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(origToken), msg.sender, address(this), _amount);
            // transfer DAI to Couompound receiving cDai
            sendErc20ToCream(origToken, _amount);
        }
        uint256 newCrTokenBalance = getTokenBalance(crToken);
        if (newCrTokenBalance > prevCrTokenBalance) {
            //Mint trancheB tokens and send them to msg.sender;
            IJTrancheTokens(trancheAddresses[_trancheNum].BTrancheAddress).mint(msg.sender, tbAmount);
        } else 
            tbAmount = 0;

        stakeCounterTrB[msg.sender][_trancheNum] = stakeCounterTrB[msg.sender][_trancheNum].add(1);
        StakingDetails storage details = stakingDetailsTrancheB[msg.sender][_trancheNum][stakeCounterTrB[msg.sender][_trancheNum]];
        details.startTime = block.timestamp;
        details.amount = tbAmount;

        lastActivity[msg.sender] = block.number;
        emit TrancheBTokenMinted(_trancheNum, msg.sender, _amount, tbAmount);
    }

    /**
     * @dev redeem Tranche B Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function redeemTrancheBToken(uint256 _trancheNum, uint256 _amount) external nonReentrant {
        require((block.number).sub(lastActivity[msg.sender]) >= redeemTimeout, "JCream: redeem timeout not expired on tranche B");
        // check approve
        require(IERC20Upgradeable(trancheAddresses[_trancheNum].BTrancheAddress).allowance(msg.sender, address(this)) >= _amount, "JCream: allowance failed redeeming tranche B");
        //Transfer DAI from msg.sender to protocol;
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(trancheAddresses[_trancheNum].BTrancheAddress), msg.sender, address(this), _amount);

        uint256 oldBal;
        uint256 diffBal;
        uint256 userAmount;
        uint256 feesAmount;
        // refresh value for tranche A
        setTrancheAExchangeRate(_trancheNum);

        address origToken = trancheAddresses[_trancheNum].buyerCoinAddress;
        address crToken = trancheAddresses[_trancheNum].crTokenAddress;
        uint16 redeemPerc = trancheParameters[_trancheNum].redemptionPercentage;

        // get tranche B exchange rate
        // if normalized price in tranche B price, everything should be scaled to 1e18 
        uint256 tbAmount = _amount.mul(getTrancheBExchangeRate(_trancheNum)).div(1e18);
        uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
        uint256 normAmount = tbAmount.div(10 ** diffDec);
        uint256 crTokenBal = getTokenBalance(crToken); // needed for emergency
        if (origToken == address(0)){
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(crToken), address(ethGateway), crTokenBal);
            // calculate tbETH amount via cETH price
            oldBal = getEthBalance();
            ethGateway.withdrawETH(normAmount, address(this), false, crTokenBal);
            diffBal = getEthBalance().sub(oldBal);
            userAmount = diffBal.mul(redeemPerc).div(PERCENT_DIVIDER);
            TransferETHHelper.safeTransferETH(msg.sender, userAmount);
            feesAmount = diffBal.sub(userAmount);
            if (diffBal != userAmount && feesAmount > 0) {
                // transfer fees to JFeesCollector
                TransferETHHelper.safeTransferETH(feesCollectorAddress, feesAmount);
            }   
        } else {
            // calculate taToken amount via crToken price
            oldBal = getTokenBalance(origToken);
            require(redeemCErc20Tokens(origToken, normAmount, false) == 0, "JCream: incorrect answer from crToken");
            diffBal = getTokenBalance(origToken);
            userAmount = diffBal.mul(redeemPerc).div(PERCENT_DIVIDER);
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(origToken), msg.sender, userAmount);
            feesAmount = diffBal.sub(userAmount);
            if (diffBal != userAmount && feesAmount > 0) {
                // transfer fees to JFeesCollector
                SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(origToken), feesCollectorAddress, feesAmount);
            }   
        }

        // claim and transfer rewards to msg.sender. Be sure to wait for this function to be completed! 
        bool rewClaimCompleted = IIncentivesController(incentivesControllerAddress).claimRewardsAllMarkets(msg.sender);

        // decrease tokens after claiming rewards
        if (rewClaimCompleted && _amount > 0)
            decreaseTrancheBTokenFromStake(_trancheNum, _amount);
        
        IJTrancheTokens(trancheAddresses[_trancheNum].BTrancheAddress).burn(_amount);
        lastActivity[msg.sender] = block.number;
        
        emit TrancheBTokenRedemption(_trancheNum, msg.sender, _amount,  userAmount, feesAmount);
    }

    /**
     * @dev redeem every crToken amount and send values to fees collector
     * @param _trancheNum tranche number
     * @param _crTokenAmount crToken amount to send to cream protocol
     */
    function redeemCrTokenAmount(uint256 _trancheNum, uint256 _crTokenAmount) external onlyAdmins nonReentrant {
        uint256 oldBal;
        uint256 diffBal;
        uint256 crTokenBal = getTokenBalance(trancheAddresses[_trancheNum].crTokenAddress); // needed for emergency
        address origToken = trancheAddresses[_trancheNum].buyerCoinAddress;
        if (origToken == address(0)) {
            oldBal = getEthBalance();
            ethGateway.withdrawETH(_crTokenAmount, address(this), true, crTokenBal);
            diffBal = getEthBalance().sub(oldBal);
            TransferETHHelper.safeTransferETH(feesCollectorAddress, diffBal);
        } else {
            // calculate taToken amount via crToken price
            oldBal = getTokenBalance(origToken);
            require(redeemCErc20Tokens(origToken, _crTokenAmount, true) == 0, "JCream: incorrect answer from crToken");
            diffBal = getTokenBalance(origToken);
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(origToken), feesCollectorAddress, diffBal);
        }
    }

    /**
     * @dev get every token balance in this contract
     * @param _tokenContract token contract address
     */
    function getTokenBalance(address _tokenContract) public view returns (uint256) {
        return IERC20Upgradeable(_tokenContract).balanceOf(address(this));
    }

    /**
     * @dev get eth balance on this contract
     */
    function getEthBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev transfer tokens in this contract to fees collector contract
     * @param _tokenContract token contract address
     * @param _amount token amount to be transferred 
     */
    function transferTokenToFeesCollector(address _tokenContract, uint256 _amount) external onlyAdmins {
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(_tokenContract), feesCollectorAddress, _amount);
    }

    /**
     * @dev transfer ethers in this contract to fees collector contract
     * @param _amount ethers amount to be transferred 
     */
    function withdrawEthToFeesCollector(uint256 _amount) external onlyAdmins {
        TransferETHHelper.safeTransferETH(feesCollectorAddress, _amount);
    }

    /**
     * @dev get total accrued Comp token from all market in comptroller
     * @return comp amount accrued
     */
    function getTotalCreamAccrued() public view onlyAdmins returns (uint256) {
        return IComptrollerInterface(creamtrollerAddress).compAccrued(address(this));
    }

    /**
     * @dev claim total accrued Comp token from all market in comptroller and transfer the amount to a receiver address
     * @param _receiver destination address
     */
    function claimTotalCreamAccruedToReceiver(address _receiver) external onlyAdmins nonReentrant {
        uint256 totAccruedAmount = getTotalCreamAccrued();
        if (totAccruedAmount > 0) {
            IComptrollerInterface(creamtrollerAddress).claimComp(address(this));
            uint256 amount = IERC20Upgradeable(creamTokenAddress).balanceOf(address(this));
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(creamTokenAddress), _receiver, amount);
        }
    }

}