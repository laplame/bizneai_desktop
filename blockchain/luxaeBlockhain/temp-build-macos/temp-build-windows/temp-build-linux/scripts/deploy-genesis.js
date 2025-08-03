import fs from 'fs';
import path from 'path';
import solc from 'solc';
import Web3 from 'web3';

// Configuración de la red
const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

// Ruta al contrato
const contractPath = path.resolve('contracts', 'contratoBase.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// Compilar el contrato
const input = {
    language: 'Solidity',
    sources: {
        'contratoBase.sol': {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*'],
            },
        },
    },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

function findImports(importPath) {
    if (importPath.startsWith('@openzeppelin/')) {
        return { contents: fs.readFileSync(`node_modules/${importPath}`, 'utf8') };
    }
    return { error: 'File not found' };
}

// Verificar si el contrato está presente
if (!output.contracts || !output.contracts['contratoBase.sol'] || !output.contracts['contratoBase.sol']['GenesisToken']) {
    console.error('Error: No se encontró el contrato GenesisToken en la salida del compilador.');
    console.log(JSON.stringify(output, null, 2)); // Imprimir la salida del compilador para depuración
    process.exit(1);
}

const contract = output.contracts['contratoBase.sol']['GenesisToken'];

// Desplegar el contrato
async function deploy() {
    const accounts = await web3.eth.getAccounts();
    console.log('Desplegando desde la cuenta:', accounts[0]);

    const result = await new web3.eth.Contract(contract.abi)
        .deploy({ data: contract.evm.bytecode.object, arguments: [accounts[1], accounts[2], accounts[3], []] })
        .send({
            from: accounts[0],
            gas: '3000000',
            gasPrice: web3.utils.toWei('20', 'gwei')
        });

    console.log('Contrato desplegado en:', result.options.address);
}

deploy().catch(console.error); 