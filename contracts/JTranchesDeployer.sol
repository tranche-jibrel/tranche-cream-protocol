// SPDX-License-Identifier: MIT
/**
 * Created on 2021-02-11
 * @summary: Jibrel Cream Tranche Deployer
 * @author: Jibrel Team
 */
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "./interfaces/IJTranchesDeployer.sol";
import "./JTrancheAToken.sol";
import "./JTrancheBToken.sol";
import "./JTranchesDeployerStorage.sol";


contract JTranchesDeployer is OwnableUpgradeable, JTranchesDeployerStorage, IJTranchesDeployer {
    using SafeMathUpgradeable for uint256;

    function initialize() external initializer() {
        OwnableUpgradeable.__Ownable_init();
    }

    function setJCreamAddress(address _jCream) external onlyOwner {
        jCreamAddress = _jCream;
    }

    modifier onlyProtocol() {
        require(msg.sender == jCreamAddress, "TrancheDeployer: caller is not JCream");
        _;
    }

    function deployNewTrancheATokens(string memory _nameA, 
            string memory _symbolA, 
            uint256 _trNum) external override onlyProtocol returns (address) {
        JTrancheAToken jTrancheA = new JTrancheAToken(_nameA, _symbolA, _trNum);
        jTrancheA.setJCreamMinter(msg.sender); 
        return address(jTrancheA);
    }

    function deployNewTrancheBTokens(string memory _nameB, 
            string memory _symbolB, 
            uint256 _trNum) external override onlyProtocol returns (address) {
        JTrancheBToken jTrancheB = new JTrancheBToken(_nameB, _symbolB, _trNum);
        jTrancheB.setJCreamMinter(msg.sender);
        return address(jTrancheB);
    }

}