import { ERC777 } from '@openzeppelin/contracts/token/ERC777/ERC777.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';

contract LuxaeToken777 is ERC777, Ownable {
    constructor(uint256 initialSupply, address[] memory defaultOperators) 
        ERC777("Luxae", "LXA", defaultOperators) {
        _mint(msg.sender, initialSupply, "", "");
    }

    // Puedes agregar funciones adicionales aquí si es necesario
} 