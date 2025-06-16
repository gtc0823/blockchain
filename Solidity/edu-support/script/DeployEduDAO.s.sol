// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EduDAO.sol";
import "../src/EduToken.sol";

contract DeployEduDAO is Script {
    function run() external {
        vm.startBroadcast();

        // 如果你想一起部署 EduToken（或直接用已部署的地址）
        EduToken token = new EduToken("EduToken", "EDU");

        // 你自己定義一個 treasury 地址（也可以是部署帳號地址）
        address treasury = msg.sender;

        // 部署 EduDAO，帶入 token 地址和 treasury
        EduDAO dao = new EduDAO(address(token), treasury);

        console.log("EduToken deployed at:", address(token));
        console.log("EduDAO deployed at:", address(dao));
        console.log("Treasury address:", treasury);

        vm.stopBroadcast();
    }
}
