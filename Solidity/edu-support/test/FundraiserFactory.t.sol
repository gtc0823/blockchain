// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FundraiserFactory} from "../src/FundraiserFactory.sol";
import {Fundraiser} from "../src/Fundraiser.sol";

contract FundraiserFactoryTest is Test {
    FundraiserFactory factory;
    address constant OWNER = address(0x1);

    function setUp() public {
        factory = new FundraiserFactory();
    }

    function test_CreateFundraiser() public {
        vm.prank(OWNER);
        factory.createFundraiser(
            "Test Fundraiser",
            "test.com",
            "image.com",
            "Test description",
            OWNER // For simplicity, owner is also the beneficiary
        );

        assertEq(factory.fundraisersCount(), 1);

        address[] memory fundraiserAddrs = factory.getAllFundraisers();
        assertEq(fundraiserAddrs.length, 1);

        Fundraiser fundraiser = Fundraiser(payable(fundraiserAddrs[0]));
        assertEq(fundraiser.name(), "Test Fundraiser");
        assertEq(fundraiser.owner(), OWNER);
    }

    function test_GetAllFundraisers() public {
        vm.prank(OWNER);
        factory.createFundraiser("Fundraiser 1", "", "", "", OWNER);
        
        address ANOTHER_OWNER = address(0x2);
        vm.prank(ANOTHER_OWNER);
        factory.createFundraiser("Fundraiser 2", "", "", "", ANOTHER_OWNER);

        address[] memory fundraiserAddrs = factory.getAllFundraisers();
        assertEq(fundraiserAddrs.length, 2);

        Fundraiser fundraiser1 = Fundraiser(payable(fundraiserAddrs[0]));
        Fundraiser fundraiser2 = Fundraiser(payable(fundraiserAddrs[1]));

        assertEq(fundraiser1.name(), "Fundraiser 1");
        assertEq(fundraiser2.name(), "Fundraiser 2");
    }
}
