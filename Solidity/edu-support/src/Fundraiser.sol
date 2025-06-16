// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import for Foundry debugging only — remove before deployment to production
import {console} from "forge-std/Test.sol";

/**
 * @title Fundraiser
 * @dev A smart contract for managing decentralised fundraising campaigns.
 * Each fundraiser tracks donations per donor and allows withdrawal by the owner.
 */
contract Fundraiser {
    // =============================================================
    // State Variables
    // =============================================================

    string public name;
    string public url;
    string public imageURL;
    string public description;
    address public owner;
    address payable public beneficiary;

    uint256 public totalDonations;
    mapping(address => uint256) public myDonations;

    // =============================================================
    // Events
    // =============================================================

    event DonationReceived(address indexed donor, uint256 amount);
    event Withdrawal(uint256 amount);

    // =============================================================
    // Modifiers
    // =============================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    // =============================================================
    // Functions
    // =============================================================

    constructor(
        string memory _name,
        string memory _url,
        string memory _imageURL,
        string memory _description,
        address _beneficiary,
        address _owner
    ) {
        name = _name;
        url = _url;
        imageURL = _imageURL;
        description = _description;
        beneficiary = payable(_beneficiary);
        owner = _owner;
    }

    function setBeneficiary(address payable _beneficiary) public onlyOwner {
        beneficiary = _beneficiary;
    }

    function donate() public payable {
        require(msg.value > 0, "Donation must be greater than 0");
        myDonations[msg.sender] += msg.value;
        totalDonations += msg.value;
        emit DonationReceived(msg.sender, msg.value);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool sent, ) = beneficiary.call{value: balance}("");
        require(sent, "Withdrawal failed");
        
        emit Withdrawal(balance);
    }

    /**
     * @dev Fallback handler for receiving plain ETH transfers with no calldata.
     * Increments totals and emits a DonationReceived event.
     */
    receive() external payable {
        totalDonations += msg.value;
        myDonations[msg.sender] += msg.value;
        emit DonationReceived(msg.sender, msg.value);
    }

    /**
     * @dev Fallback handler for receiving ETH with unrecognized calldata.
     * Also treats it as a donation.
     */
    fallback() external payable {
        totalDonations += msg.value;
        myDonations[msg.sender] += msg.value;
        emit DonationReceived(msg.sender, msg.value);
    }
}
