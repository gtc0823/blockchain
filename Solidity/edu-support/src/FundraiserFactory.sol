// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Fundraiser} from "./Fundraiser.sol";

/**
 * @title FundraiserFactory
 * @dev Deploys and keeps track of multiple Fundraiser contracts.
 */
contract FundraiserFactory {
    // =============================================================
    // State Variables
    // =============================================================

    Fundraiser[] public fundraisers;
    uint256 public fundraisersCount;

    // =============================================================
    // Events
    // =============================================================

    event FundraiserCreated(address indexed fundraiserAddress, address indexed owner);

    // =============================================================
    // Functions
    // =============================================================

    /**
     * @dev Creates a new Fundraiser contract and stores it.
     * @param _name The name of the fundraiser
     * @param _url A link to the campaign website
     * @param _imageURL An image representing the campaign
     * @param _description A short description of the campaign
     * @param _beneficiary The address that will receive withdrawn donations
     */
    function createFundraiser(
        string memory _name,
        string memory _url,
        string memory _imageURL,
        string memory _description,
        address _beneficiary
    ) public {
        Fundraiser newFundraiser = new Fundraiser(
            _name,
            _url,
            _imageURL,
            _description,
            _beneficiary,
            msg.sender
        );
        fundraisers.push(newFundraiser);
        fundraisersCount++;
        emit FundraiserCreated(address(newFundraiser), msg.sender);
    }

    /**
     * @dev Returns the addresses of all created Fundraiser contracts.
     */
    function getAllFundraisers() public view returns (address[] memory) {
        address[] memory addresses = new address[](fundraisers.length);
        for (uint256 i = 0; i < fundraisers.length; i++) {
            addresses[i] = address(fundraisers[i]);
        }
        return addresses;
    }
}
