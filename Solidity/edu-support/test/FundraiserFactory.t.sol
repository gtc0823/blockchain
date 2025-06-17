// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FundraiserFactory} from "../src/FundraiserFactory.sol";
import {Fundraiser} from "../src/Fundraiser.sol";

contract FundraiserFactoryTest is Test {
    FundraiserFactory factory;
    address constant OWNER = address(0x1);
    address constant DAO_ADDRESS = address(0x1337);

    function setUp() public {
        factory = new FundraiserFactory(DAO_ADDRESS);
    }

    function test_InitialState() public view {
        assertEq(factory.daoAddress(), DAO_ADDRESS);
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
        
        Fundraiser[] memory fundraisers = factory.getAllFundraisers();
        assertEq(fundraisers.length, 1);

        Fundraiser createdFundraiser = fundraisers[0];
        assertEq(createdFundraiser.name(), "Test Fundraiser");
        assertEq(createdFundraiser.owner(), OWNER);
        assertEq(createdFundraiser.daoAddress(), DAO_ADDRESS);
    }

    function test_GetAllFundraisers() public {
        vm.prank(OWNER);
        factory.createFundraiser("Fundraiser 1", "", "", "", OWNER);
        
        address ANOTHER_OWNER = address(0x2);
        vm.prank(ANOTHER_OWNER);
        factory.createFundraiser("Fundraiser 2", "", "", "", ANOTHER_OWNER);

        Fundraiser[] memory fundraisers = factory.getAllFundraisers();
        assertEq(fundraisers.length, 2);

        assertEq(fundraisers[0].name(), "Fundraiser 1");
        assertEq(fundraisers[1].name(), "Fundraiser 2");
    }
} 