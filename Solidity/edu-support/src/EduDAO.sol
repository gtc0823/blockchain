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
    event ProposalExecuted(uint256 proposalId, address fundraiser, uint256 amount);

    // --- State Variables ---
    EduToken public immutable token;
    uint256 public nextProposalId;

    enum ProposalState {
        Pending,
        Approved,
        Rejected,
        Executed
    }

    struct ProposalView {
        address proposer;
        address fundraiserContract;
        string description;
        uint256 creationTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 votingEndTime;
        ProposalState state;
    }

    struct Proposal {
        address proposer;
        address fundraiserContract; // The fundraiser being proposed for funding
        string description;
        uint256 creationTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 votingEndTime;
        ProposalState state;
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
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant VOTE_THRESHOLD = 100 * 10**18; // 100 tokens
    address public treasury;

    constructor(address _tokenAddress, address _treasury) {
        token = EduToken(_tokenAddress);
        treasury = _treasury;
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
        p.votingEndTime = block.timestamp + VOTING_PERIOD;
        p.state = ProposalState.Pending;
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
        require(p.state == ProposalState.Pending, "Voting period ended");
        require(block.timestamp < p.votingEndTime, "Voting period ended");
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

    /**
     * @notice Get the current state of a proposal
     * @param _proposalId The ID of the proposal
     * @return The current state of the proposal
     */
    function getProposalState(uint256 _proposalId) public view proposalExists(_proposalId) returns (ProposalState) {
        return proposals[_proposalId].state;
    }

    /**
     * @notice Get the voting power of an address for a specific proposal
     * @param _proposalId The ID of the proposal
     * @param _voter The address of the voter
     * @return The voting power of the address
     */
    function getVotingPower(uint256 _proposalId, address _voter) public view proposalExists(_proposalId) returns (uint256) {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp < p.votingEndTime, "Voting period ended");
        return token.balanceOf(_voter);
    }

    /**
     * @notice Get the full details of a proposal
     * @param _proposalId The ID of the proposal
     * @return A ProposalView struct containing the proposal details
     */
    function getProposal(uint256 _proposalId) public view proposalExists(_proposalId) returns (ProposalView memory) {
        Proposal storage p = proposals[_proposalId];
        return ProposalView({
            proposer: p.proposer,
            fundraiserContract: p.fundraiserContract,
            description: p.description,
            creationTime: p.creationTime,
            forVotes: p.forVotes,
            againstVotes: p.againstVotes,
            votingEndTime: p.votingEndTime,
            state: p.state
        });
    }

    function executeProposal(uint256 _proposalId) public proposalExists(_proposalId) {
        Proposal storage p = proposals[_proposalId];
        require(p.state == ProposalState.Pending, "Proposal already executed");
        require(block.timestamp >= p.votingEndTime, "Voting period not ended");

        if (p.forVotes > p.againstVotes && p.forVotes >= VOTE_THRESHOLD) {
            // Transfer funds from treasury to fundraiser
            Fundraiser fundraiser = Fundraiser(payable(p.fundraiserContract));
            uint256 amount = fundraiser.targetAmount();
            require(
                token.transferFrom(treasury, p.fundraiserContract, amount),
                "Fund transfer failed"
            );
            p.state = ProposalState.Executed;
            emit ProposalExecuted(_proposalId, p.fundraiserContract, amount);
        } else {
            p.state = ProposalState.Rejected;
        }
    }
}
