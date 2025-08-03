import net from 'net';

function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is in use`);
                resolve(false);
            }
        });
        
        server.once('listening', () => {
            server.close();
            console.log(`Port ${port} is available`);
            resolve(true);
        });
        
        server.listen(port);
    });
}

async function checkPorts() {
    console.log('Checking ports...');
    await checkPort(3000);  // API port
    await checkPort(30303); // P2P port
}

checkPorts(); 