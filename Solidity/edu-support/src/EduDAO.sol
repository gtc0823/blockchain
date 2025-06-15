// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EduToken} from "./EduToken.sol";
import {Fundraiser} from "./Fundraiser.sol";

/**
 * @title EduDAO
 * @author Your Name
 * @notice A Decentralized Autonomous Organization for funding educational projects.
 * It manages proposals, voting, and execution based on the EduToken governance token.
 */
contract EduDAO {
    // --- Events ---
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        address fundraiserContract,
        string description
    );
    event Voted(uint256 proposalId, address voter, bool inFavor, uint256 weight);

    // --- State Variables ---
    EduToken public immutable token;
    uint256 public nextProposalId;

    struct Proposal {
        address proposer;
        address fundraiserContract; // The fundraiser being proposed for funding
        string description;
        uint256 creationTime;
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;

    // --- Modifiers ---
    modifier proposalExists(uint256 _proposalId) {
        require(
            proposals[_proposalId].proposer != address(0),
            "Proposal does not exist"
        );
        _;
    }

    // --- Functions ---
    constructor(address _tokenAddress) {
        token = EduToken(_tokenAddress);
    }

    /**
     * @notice Creates a new proposal to fund a fundraiser.
     * @param _fundraiserContract The address of the fundraiser contract.
     * @param _description A description of the proposal.
     */
    function createProposal(
        address _fundraiserContract,
        string memory _description
    ) public {
        require(
            _fundraiserContract != address(0),
            "Invalid fundraiser contract address"
        );
        uint256 proposalId = nextProposalId++;
        Proposal storage p = proposals[proposalId];

        p.proposer = msg.sender;
        p.fundraiserContract = _fundraiserContract;
        p.description = _description;
        p.creationTime = block.timestamp;
        // forVotes and againstVotes are already 0 by default

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _fundraiserContract,
            _description
        );
    }

    /**
     * @notice Cast a vote on a proposal.
     * @param _proposalId The ID of the proposal to vote on.
     * @param _inFavor True for a 'for' vote, false for an 'against' vote.
     */
    function vote(uint256 _proposalId, bool _inFavor)
        public
        proposalExists(_proposalId)
    {
        Proposal storage p = proposals[_proposalId];
        require(!p.hasVoted[msg.sender], "Already voted");

        uint256 votingPower = token.balanceOf(msg.sender);
        require(votingPower > 0, "No voting power");

        p.hasVoted[msg.sender] = true;

        if (_inFavor) {
            p.forVotes += votingPower;
        } else {
            p.againstVotes += votingPower;
        }

        emit Voted(_proposalId, msg.sender, _inFavor, votingPower);
    }
} 