// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Fundraiser} from "../src/Fundraiser.sol";

contract FundraiserTest is Test {
    Fundraiser fundraiser;
    address constant OWNER = address(0x1);
    address constant BENEFICIARY = address(0x2);
    address constant DONOR = address(0x3);

    function setUp() public {
        fundraiser = new Fundraiser(
            "Test Fundraiser",
            "test.com",
            "image.com",
            "Test description",
            BENEFICIARY,
            OWNER
        );
    }

    function test_InitialState() public view {
        assertEq(fundraiser.name(), "Test Fundraiser");
        assertEq(fundraiser.owner(), OWNER);
        assertEq(fundraiser.beneficiary(), BENEFICIARY);
    }

    function test_SetBeneficiary() public {
        vm.prank(OWNER);
        address newBeneficiary = address(0x4);
        fundraiser.setBeneficiary(payable(newBeneficiary));
        assertEq(fundraiser.beneficiary(), newBeneficiary);
    }

    function test_FailSetBeneficiaryNotOwner() public {
        vm.prank(DONOR);
        address newBeneficiary = address(0x4);
        vm.expectRevert("You are not the owner");
        fundraiser.setBeneficiary(payable(newBeneficiary));
    }

    function test_Donate() public {
        uint256 donationAmount = 1 ether;
        vm.prank(DONOR);
        vm.deal(DONOR, donationAmount);
        
        fundraiser.donate{value: donationAmount}();

        assertEq(fundraiser.totalDonations(), donationAmount);
        assertEq(fundraiser.myDonations(DONOR), donationAmount);
        assertEq(address(fundraiser).balance, donationAmount);
    }

    function test_FailDonateZero() public {
        vm.prank(DONOR);
        vm.expectRevert("Donation must be greater than 0");
        fundraiser.donate{value: 0}();
    }

    function test_Withdraw() public {
        uint256 donationAmount = 1 ether;
        vm.prank(DONOR);
        vm.deal(DONOR, donationAmount);
        fundraiser.donate{value: donationAmount}();

        uint256 initialBeneficiaryBalance = BENEFICIARY.balance;

        vm.prank(OWNER);
        fundraiser.withdraw();

        assertEq(address(fundraiser).balance, 0);
        assertEq(BENEFICIARY.balance, initialBeneficiaryBalance + donationAmount);
    }

    function test_FailWithdrawNotOwner() public {
        vm.prank(DONOR);
        vm.expectRevert("You are not the owner");
        fundraiser.withdraw();
    }
} 