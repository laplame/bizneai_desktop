import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'net';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Verificar puertos antes de iniciar
const checkPort = (port) => new Promise((resolve) => {
    const server = createServer();
    
    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Puerto ${port} está en uso, intentando liberar...`);
            exec(`lsof -ti:${port} | xargs kill -9`, (err) => {
                if (err) console.log(`No se pudo liberar el puerto ${port}`);
                else console.log(`Puerto ${port} liberado`);
                resolve(false);
            });
        }
    });
    
    server.once('listening', () => {
        server.close();
        resolve(true);
    });
    
    server.listen(port);
});

// Middlewares
app.use(cors());
app.use(express.json());

// Verificar que dist existe
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.error('Error: La carpeta dist no existe. Ejecuta pnpm build primero.');
    process.exit(1);
}

// Servir archivos estáticos
app.use(express.static(distPath));

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health check endpoint para el dashboard
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'dashboard' });
});

// Ruta para servir la aplicación React
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Iniciar servidor con verificación de puertos
async function startServer() {
    try {
        // Verificar puerto de la blockchain
        await checkPort(3000);
        // Verificar puerto del dashboard
        await checkPort(3001);
        
        app.listen(PORT, () => {
            console.log(`Dashboard server running on port ${PORT}`);
            console.log(`Sirviendo archivos desde: ${distPath}`);
            
            // Verificar archivos
            const files = ['index.html', 'assets'];
            files.forEach(file => {
                const filePath = path.join(distPath, file);
                if (!fs.existsSync(filePath)) {
                    console.warn(`Advertencia: ${file} no encontrado en ${distPath}`);
                } else {
                    console.log(`✓ ${file} encontrado`);
                }
            });
        });
    } catch (error) {
        console.error('Error iniciando el servidor:', error);
        process.exit(1);
    }
}

startServer();