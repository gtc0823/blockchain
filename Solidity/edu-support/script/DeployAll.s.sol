// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EduToken} from "../src/EduToken.sol";
import {FundraiserFactory} from "../src/FundraiserFactory.sol";
import {EduDAO} from "../src/EduDAO.sol";

contract DeployAll is Script {
    function run() external returns (EduToken, FundraiserFactory, EduDAO) {
        vm.startBroadcast();

        // 1. 部署 EduToken
        EduToken token = new EduToken("EduToken", "EDU");
        console.log("EduToken deployed at:", address(token));

        // 2. 部署 FundraiserFactory
        //FundraiserFactory factory = new FundraiserFactory(address(token));
        FundraiserFactory factory = new FundraiserFactory();
        console.log("FundraiserFactory deployed at:", address(factory));

        // 3. 部署 EduDAO（傳入 token 和 treasury）
        address treasury = msg.sender;
        EduDAO dao = new EduDAO(address(token), treasury);
        console.log("EduDAO deployed at:", address(dao));
        console.log("Treasury address:", treasury);

        // ✅ 4. Treasury 授權 DAO 合約轉帳 EDU token
        token.approve(address(dao), type(uint256).max);
        console.log("Treasury approved DAO to transfer EDU tokens");

        vm.stopBroadcast();
        return (token, factory, dao);
    }
}

