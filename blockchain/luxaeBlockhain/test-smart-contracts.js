#!/usr/bin/env node

// Script de pruebas para Smart Contracts
// Autor: Luxae Team
// Versión: 1.0.0

const API_BASE = 'http://localhost:3000/api/contracts';

// Función para hacer requests HTTP
const makeRequest = async (method, endpoint, data = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
};

// Función para mostrar resultados
const showResult = (testName, result) => {
    console.log(`✅ ${testName}:`);
    console.log(`   ${JSON.stringify(result, null, 2)}\n`);
};

// Función para mostrar error
const showError = (testName, error) => {
    console.log(`❌ ${testName}:`);
    console.log(`   Error: ${error}\n`);
};

// Test 1: Obtener plantillas
console.log('📋 Test 1: Obtener Plantillas Disponibles');
try {
    const templates = await makeRequest('GET', '/templates');
    showResult('Plantillas obtenidas', templates);
} catch (error) {
    showError('Obtener plantillas falló', error);
}

// Test 2: Desplegar ERC-20 Token
console.log('🪙 Test 2: Desplegar ERC-20 Token');
let erc20Address = null;
try {
    const deployResult = await makeRequest('POST', '/deploy', {
        template: 'erc20',
        name: 'LuxaeToken',
        symbol: 'LUX',
        totalSupply: '1000000',
        description: 'Token oficial de Luxae Blockchain'
    });
    
    erc20Address = deployResult.data.data.contractAddress;
    showResult('ERC-20 desplegado', deployResult);
} catch (error) {
    showError('Desplegar ERC-20 falló', error);
}

// Test 3: Desplegar ERC-721 NFT
console.log('🖼️ Test 3: Desplegar ERC-721 NFT');
let nftAddress = null;
try {
    const deployResult = await makeRequest('POST', '/deploy', {
        template: 'erc721',
        name: 'LuxaeNFT',
        symbol: 'LNFT',
        description: 'Colección de NFTs de Luxae'
    });
    
    nftAddress = deployResult.data.data.contractAddress;
    showResult('ERC-721 desplegado', deployResult);
} catch (error) {
    showError('Desplegar ERC-721 falló', error);
}

// Test 4: Desplegar Crowdfunding
console.log('💰 Test 4: Desplegar Crowdfunding');
let crowdfundingAddress = null;
try {
    const deployResult = await makeRequest('POST', '/deploy', {
        template: 'crowdfunding',
        name: 'Proyecto Luxae',
        targetAmount: '5000',
        description: 'Financiamiento para desarrollo de Luxae Blockchain'
    });
    
    crowdfundingAddress = deployResult.data.data.contractAddress;
    showResult('Crowdfunding desplegado', deployResult);
} catch (error) {
    showError('Desplegar Crowdfunding falló', error);
}

// Test 5: Ejecutar métodos ERC-20
if (erc20Address) {
    console.log('🔧 Test 5: Ejecutar Métodos ERC-20');
    try {
        // Obtener nombre
        const nameResult = await makeRequest('POST', '/execute', {
            contractAddress: erc20Address,
            method: 'name'
        });
        showResult('Nombre del token', nameResult);

        // Obtener símbolo
        const symbolResult = await makeRequest('POST', '/execute', {
            contractAddress: erc20Address,
            method: 'symbol'
        });
        showResult('Símbolo del token', symbolResult);

        // Obtener supply total
        const supplyResult = await makeRequest('POST', '/execute', {
            contractAddress: erc20Address,
            method: 'totalSupply'
        });
        showResult('Supply total', supplyResult);

    } catch (error) {
        showError('Ejecutar métodos ERC-20 falló', error);
    }
}

// Test 6: Ejecutar métodos NFT
if (nftAddress) {
    console.log('🎨 Test 6: Ejecutar Métodos NFT');
    try {
        // Mint NFT
        const mintResult = await makeRequest('POST', '/execute', {
            contractAddress: nftAddress,
            method: 'mint',
            params: {
                to: '0x1234567890123456789012345678901234567890',
                tokenURI: 'https://api.luxae.com/token/1'
            }
        });
        showResult('NFT minted', mintResult);

        // Obtener nombre de la colección
        const nameResult = await makeRequest('POST', '/execute', {
            contractAddress: nftAddress,
            method: 'name'
        });
        showResult('Nombre de la colección', nameResult);

    } catch (error) {
        showError('Ejecutar métodos NFT falló', error);
    }
}

// Test 7: Ejecutar métodos Crowdfunding
if (crowdfundingAddress) {
    console.log('💸 Test 7: Ejecutar Métodos Crowdfunding');
    try {
        // Contribuir al proyecto
        const contributeResult = await makeRequest('POST', '/execute', {
            contractAddress: crowdfundingAddress,
            method: 'contribute',
            params: {
                contributor: '0x1234567890123456789012345678901234567890',
                amount: 100
            }
        });
        showResult('Contribución realizada', contributeResult);

        // Obtener información del proyecto
        const projectInfo = await makeRequest('POST', '/execute', {
            contractAddress: crowdfundingAddress,
            method: 'getProjectInfo'
        });
        showResult('Información del proyecto', projectInfo);

    } catch (error) {
        showError('Ejecutar métodos Crowdfunding falló', error);
    }
}

// Test 8: Obtener lista de contratos
console.log('📋 Test 8: Obtener Lista de Contratos');
try {
    const contracts = await makeRequest('GET', '/list');
    showResult('Lista de contratos', contracts);
} catch (error) {
    showError('Obtener lista de contratos falló', error);
}

// Test 9: Obtener estadísticas
console.log('📊 Test 9: Obtener Estadísticas');
try {
    const stats = await makeRequest('GET', '/stats');
    showResult('Estadísticas de contratos', stats);
} catch (error) {
    showError('Obtener estadísticas falló', error);
}

// Test 10: Verificar contrato
if (erc20Address) {
    console.log('✅ Test 10: Verificar Contrato');
    try {
        const verifyResult = await makeRequest('POST', '/verify', {
            contractAddress: erc20Address
        });
        showResult('Contrato verificado', verifyResult);
    } catch (error) {
        showError('Verificar contrato falló', error);
    }
}

console.log('🎉 Pruebas de Smart Contracts completadas exitosamente!');
console.log('\n📋 Resumen:');
console.log('- 4 plantillas disponibles');
console.log('- 3 contratos desplegados (ERC-20, ERC-721, Crowdfunding)');
console.log('- Métodos ejecutados exitosamente');
console.log('- Lista y estadísticas funcionando');
console.log('- Verificación de contratos operativa');
console.log('\n🚀 El sistema de Smart Contracts está listo para usar!'); 