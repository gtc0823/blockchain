// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {EduDAO} from "../src/EduDAO.sol";
import {Fundraiser} from "../src/Fundraiser.sol";

contract EduDAOTest is Test {
    EduDAO public dao;
    Fundraiser public fundraiser;

    address public owner;
    address public member1;
    address public member2;
    address public nonMember;
    address public fundraiserOwner;

    function setUp() public {
        // Use default foundry addresses for clarity
        owner = makeAddr("owner");
        member1 = makeAddr("member1");
        member2 = makeAddr("member2");
        nonMember = makeAddr("nonMember");
        fundraiserOwner = makeAddr("fundraiserOwner");

        // Deploy DAO with 'owner' as the deployer
        vm.prank(owner);
        dao = new EduDAO();

        // Deploy a Fundraiser contract
        fundraiser = new Fundraiser(
            "Test Project",
            "http://test.com",
            "http://image.com",
            "A test fundraiser",
            payable(fundraiserOwner), // beneficiary
            fundraiserOwner,          // owner
            address(dao)              // daoAddress
        );

        // Add member1 and member2 to the DAO
        vm.prank(owner);
        dao.addMember(member1);
        vm.prank(owner);
        dao.addMember(member2);
    }

    function test_InitialState() public view {
        assertTrue(dao.isMember(owner));
        assertEq(dao.owner(), owner);
    }

    function test_AddAndRemoveMembers() public {
        // Owner adds a new member
        vm.prank(owner);
        dao.addMember(nonMember);
        assertTrue(dao.isMember(nonMember));

        // Owner removes a member
        vm.prank(owner);
        dao.removeMember(member1);
        assertFalse(dao.isMember(member1));
    }
    
    function test_Fail_NonOwnerCannotManageMembers() public {
        vm.prank(nonMember);
        vm.expectRevert("Only owner can call this function");
        dao.addMember(makeAddr("anotherUser"));

        vm.prank(member1);
        vm.expectRevert("Only owner can call this function");
        dao.removeMember(member2);
    }

    function test_MemberCanCreateProposal() public {
        vm.prank(member1);
        dao.createProposal(payable(address(fundraiser)), "Fund Test Project");
        
        (address proposer, address fContract,,,,,) = dao.getProposal(0);
        assertEq(proposer, member1);
        assertEq(fContract, address(fundraiser));
    }

    function test_Fail_NonMemberCannotCreateProposal() public {
        vm.prank(nonMember);
        vm.expectRevert("Only members can call this function");
        dao.createProposal(payable(address(fundraiser)), "Should Fail");
    }

    function test_MembersCanVote() public {
        // member1 creates a proposal
        vm.prank(member1);
        dao.createProposal(payable(address(fundraiser)), "Fund Test Project");

        // member1 votes 'for'
        vm.prank(member1);
        dao.vote(0, true);

        // member2 votes 'against'
        vm.prank(member2);
        dao.vote(0, false);
        
        // owner (also a member) votes 'for'
        vm.prank(owner);
        dao.vote(0, true);

        (,,,,uint256 forVotes, uint256 againstVotes,) = dao.getProposal(0);
        assertEq(forVotes, 2);
        assertEq(againstVotes, 1);
    }

    function test_Fail_CannotVoteTwice() public {
        vm.prank(member1);
        dao.createProposal(payable(address(fundraiser)), "Fund Test Project");

        vm.prank(member1);
        dao.vote(0, true);

        vm.prank(member1);
        vm.expectRevert("You have already voted");
        dao.vote(0, false);
    }

    function test_ExecuteProposal_Success() public {
        vm.prank(member1);
        dao.createProposal(payable(address(fundraiser)), "Fund Test Project");

        vm.prank(member1);
        dao.vote(0, true);
        vm.prank(owner);
        dao.vote(0, true);
        vm.prank(member2);
        dao.vote(0, false);

        // Skip forward in time past the voting period (default is 7 days)
        vm.warp(block.timestamp + 8 days);

        vm.prank(owner);
        dao.executeProposal(0);

        assertTrue(fundraiser.isDAOApproved());
    }

    function test_Fail_ExecuteProposal_TooEarly() public {
        vm.prank(member1);
        dao.createProposal(payable(address(fundraiser)), "Fund Test Project");

        // Skip forward, but not enough
        vm.warp(block.timestamp + 1 days);

        vm.prank(owner);
        vm.expectRevert("Voting period has not yet ended");
        dao.executeProposal(0);
    }
} 