// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GenesisMessage {
    string public constant GENESIS_QUOTE = "El dinero es una tecnologia para almacenar y transmitir valor de forma descentralizada.";
    address public immutable creator;
    uint256 public immutable timestamp;

    event MessageRead(address indexed reader, uint256 timestamp);

    constructor() {
        creator = msg.sender;
        timestamp = block.timestamp;
    }

    function readMessage() public returns (string memory) {
        emit MessageRead(msg.sender, block.timestamp);
        return GENESIS_QUOTE;
    }

    function getMessageInfo() public view returns (address, uint256, uint256) {
        return (creator, timestamp, bytes(GENESIS_QUOTE).length);
    }
} 