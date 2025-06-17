// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import "forge-std/console.sol";
import {EduDAO} from "../src/EduDAO.sol";
import {FundraiserFactory} from "../src/FundraiserFactory.sol";

contract DeployDAO is Script {
    function run() external returns (address, address) {
        vm.startBroadcast();

        // 1. Deploy EduDAO contract
        EduDAO eduDAO = new EduDAO();
        console.log("EduDAO deployed at:", address(eduDAO));

        // 2. Deploy FundraiserFactory, passing the EduDAO address
        FundraiserFactory fundraiserFactory = new FundraiserFactory(address(eduDAO));
        console.log("FundraiserFactory deployed at:", address(fundraiserFactory));

        vm.stopBroadcast();
        return (address(eduDAO), address(fundraiserFactory));
    }
} 