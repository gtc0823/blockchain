// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {EduDAO} from "../src/EduDAO.sol";
import {EduToken} from "../src/EduToken.sol";
import {Fundraiser} from "../src/Fundraiser.sol";

contract EduDAOTest is Test {
    EduDAO public dao;
    EduToken public token;
    Fundraiser public fundraiser;

    address public owner = address(0x123);
    address public voter1 = address(0x456);
    address public voter2 = address(0x789);
    address public proposer = address(0xABC);

    function setUp() public {
        // Deploy Token and DAO
        vm.prank(owner);
        token = new EduToken("EduToken", "EDU");
        dao = new EduDAO(address(token));

        // Deploy a dummy Fundraiser contract
        fundraiser = new Fundraiser(
            "Test Project",
            "http://test.com",
            "http://image.com",
            "A test fundraiser",
            proposer, // beneficiary
            owner     // owner
        );

        // Mint some tokens to voters
        vm.prank(owner);
        token.mint(voter1, 100 ether);
        vm.prank(owner);
        token.mint(voter2, 50 ether);
    }

    function test_CreateProposal() public {
        vm.prank(proposer);
        dao.createProposal(address(fundraiser), "Fund Test Project");

        (address p_proposer, address p_fundraiserContract, string memory p_description, ,,) = dao.proposals(0);
        assertEq(p_proposer, proposer);
        assertEq(p_fundraiserContract, address(fundraiser));
        assertEq(p_description, "Fund Test Project");
    }

    function test_Vote() public {
        // Create a proposal first
        vm.prank(proposer);
        dao.createProposal(address(fundraiser), "Fund Test Project");

        // Voter 1 votes 'for'
        vm.prank(voter1);
        dao.vote(0, true);

        // Voter 2 votes 'against'
        vm.prank(voter2);
        dao.vote(0, false);

        (,,, , uint256 p_forVotes, uint256 p_againstVotes) = dao.proposals(0);
        assertEq(p_forVotes, 100 ether);
        assertEq(p_againstVotes, 50 ether);
    }

    function test_Fail_Vote_NoPower() public {
        vm.prank(proposer);
        dao.createProposal(address(fundraiser), "Fund Test Project");

        vm.prank(proposer); // Proposer has no tokens
        vm.expectRevert("No voting power");
        dao.vote(0, true);
    }

    function test_Fail_Vote_Twice() public {
        vm.prank(proposer);
        dao.createProposal(address(fundraiser), "Fund Test Project");

        vm.prank(voter1);
        dao.vote(0, true);

        vm.prank(voter1); // Voter 1 tries to vote again
        vm.expectRevert("Already voted");
        dao.vote(0, false);
    }

    function test_Fail_Vote_NonExistentProposal() public {
        vm.prank(voter1);
        vm.expectRevert("Proposal does not exist");
        dao.vote(999, true); // Vote on a proposal that doesn't exist
    }
} 