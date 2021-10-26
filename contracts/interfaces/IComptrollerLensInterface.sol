// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IComptrollerLensInterface {
    function claimComp(address) external;
    function creamAccrued(address) external view returns (uint);
}
