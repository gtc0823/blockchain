// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Fundraiser} from "./Fundraiser.sol";

/**
 * @title EduDAO (Simple)
 * @notice A simplified DAO for educational project approvals, managed by members.
 */
contract EduDAO {
    // =============================================================
    // State Variables
    // =============================================================

    address public owner;
    mapping(address => bool) public isMember;
    uint256 public nextProposalId;
    uint256 public votingPeriod; // in seconds, e.g., 7 days

    struct Proposal {
        address proposer;
        Fundraiser fundraiserContract; // The fundraiser being proposed for approval
        string description;
        uint256 creationTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;

    // =============================================================
    // Events
    // =============================================================
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed fundraiserContract);
    event Voted(uint256 indexed proposalId, address indexed voter, bool inFavor);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);

    // =============================================================
    // Modifiers
    // =============================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "Only members can call this function");
        _;
    }
    
    // =============================================================
    // Functions
    // =============================================================

    constructor() {
        owner = msg.sender;
        isMember[msg.sender] = true; // The deployer is the first member
        votingPeriod = 7 days; // Set a default 7-day voting period
        emit MemberAdded(msg.sender);
    }

    function addMember(address _newMember) public onlyOwner {
        require(_newMember != address(0), "Invalid address");
        require(!isMember[_newMember], "Address is already a member");
        isMember[_newMember] = true;
        emit MemberAdded(_newMember);
    }

    function removeMember(address _member) public onlyOwner {
        require(isMember[_member], "Address is not a member");
        isMember[_member] = false;
        emit MemberRemoved(_member);
    }

    function createProposal(address payable _fundraiserAddress, string memory _description) public onlyMember {
        require(_fundraiserAddress != address(0), "Invalid fundraiser address");
        
        uint256 proposalId = nextProposalId++;
        Proposal storage p = proposals[proposalId];
        
        p.proposer = msg.sender;
        p.fundraiserContract = Fundraiser(_fundraiserAddress);
        p.description = _description;
        p.creationTime = block.timestamp;
        
        emit ProposalCreated(proposalId, msg.sender, _fundraiserAddress);
    }

    function vote(uint256 _proposalId, bool _inFavor) public onlyMember {
        Proposal storage p = proposals[_proposalId];
        
        require(p.proposer != address(0), "Proposal does not exist");
        require(!p.hasVoted[msg.sender], "You have already voted");
        require(block.timestamp < p.creationTime + votingPeriod, "Voting period has ended");
        
        p.hasVoted[msg.sender] = true;
        
        if (_inFavor) {
            p.forVotes++;
        } else {
            p.againstVotes++;
        }
        
        emit Voted(_proposalId, msg.sender, _inFavor);
    }

    function executeProposal(uint256 _proposalId) public onlyOwner {
        Proposal storage p = proposals[_proposalId];

        require(p.proposer != address(0), "Proposal does not exist");
        require(!p.executed, "Proposal has already been executed");
        require(block.timestamp >= p.creationTime + votingPeriod, "Voting period has not yet ended");
        
        p.executed = true;
        
        if (p.forVotes > p.againstVotes) {
            p.fundraiserContract.setDAOApproval(true);
            emit ProposalExecuted(_proposalId, true);
        } else {
            emit ProposalExecuted(_proposalId, false);
        }
    }

    /// @notice Gets the details of a specific proposal.
    /// @param _proposalId The ID of the proposal to fetch.
    /// @return proposer The address of the member who created the proposal.
    /// @return fundraiserContract The address of the fundraiser contract being proposed.
    /// @return description A description of the proposal.
    /// @return creationTime The timestamp when the proposal was created.
    /// @return forVotes The number of votes for the proposal.
    /// @return againstVotes The number of votes against the proposal.
    /// @return executed Whether the proposal has been executed.
    function getProposal(uint256 _proposalId)
        external
        view
        returns (
            address proposer,
            address fundraiserContract,
            string memory description,
            uint256 creationTime,
            uint256 forVotes,
            uint256 againstVotes,
            bool executed
        )
    {
        require(_proposalId < nextProposalId, "Proposal does not exist");
        Proposal storage p = proposals[_proposalId];
        return (
            p.proposer,
            address(p.fundraiserContract),
            p.description,
            p.creationTime,
            p.forVotes,
            p.againstVotes,
            p.executed
        );
    }
} 