// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {FundraiserFactory} from "../src/FundraiserFactory.sol";

contract DeployFundraiserFactory is Script {
    function run() public returns (FundraiserFactory) {
        vm.startBroadcast();
        FundraiserFactory factory = new FundraiserFactory();
        vm.stopBroadcast();
        return factory;
    }
}
