// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GenesisMessage {
    string public constant GENESIS_QUOTE = "Cuando aceptas dinero en pago por tu esfuerzo, lo haces sólo con el convencimiento de que lo cambiarás por el producto del esfuerzo de otros. No son los mendigos ni los saqueadores los que dan su valor al dinero. Ni un océano de lágrimas ni todas las armas del mundo pueden transformar esos papeles de tu cartera en el pan que necesitarás para sobrevivir mañana. Esos papeles, que deberían haber sido oro, son una prenda de honor – tu derecho a la energía de los hombres que producen. Tu cartera es tu manifestación de esperanza de que en algún lugar del mundo a tu alrededor hay hombres que no transgredirán ese principio moral que es el origen del dinero.";
    
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
    
    function getMessageInfo() public view returns (
        address _creator,
        uint256 _timestamp,
        uint256 _messageLength
    ) {
        return (creator, timestamp, bytes(GENESIS_QUOTE).length);
    }
} 