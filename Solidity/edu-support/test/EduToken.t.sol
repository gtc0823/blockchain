// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {EduToken} from "../src/EduToken.sol";

contract EduTokenTest is Test {
    EduToken public token;
    address public owner = address(0x123);
    address public user = address(0x456);

    function setUp() public {
        vm.prank(owner);
        token = new EduToken("EduToken", "EDU");
    }

    function test_InitialState() public {
        assertEq(token.name(), "EduToken");
        assertEq(token.symbol(), "EDU");
        assertEq(token.decimals(), 18);
        assertEq(token.owner(), owner);
        assertEq(token.balanceOf(owner), 0);
    }

    function test_Mint() public {
        vm.prank(owner);
        token.mint(user, 100 ether);
        assertEq(token.balanceOf(user), 100 ether);
    }

    function test_Fail_Mint_NotOwner() public {
        vm.prank(user); // Non-owner tries to mint
        vm.expectRevert("Only owner can call this function.");
        token.mint(user, 100 ether);
    }
} 