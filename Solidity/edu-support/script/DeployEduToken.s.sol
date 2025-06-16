// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EduToken.sol";

contract DeployEduToken is Script {
    function run() external {
        vm.startBroadcast();

        // 部署合約，初始化名稱和代號
        EduToken token = new EduToken("EduToken", "EDU");

        console.log("EduToken deployed at:", address(token));

        vm.stopBroadcast();
    }
}