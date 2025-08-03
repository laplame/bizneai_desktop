import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.validators = new Map();
        this._isRunning = false;
        this.dataDir = path.join(__dirname, '../../data/blockchain');
    }

    get isRunning() {
        return this._isRunning;
    }

    async init() {
        try {
            // Crear directorio de datos si no existe
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Cargar estado previo o inicializar con bloque génesis
            await this.loadState();
            
            if (this.chain.length === 0) {
                await this.createGenesisBlock();
            }
            
            this._isRunning = true;
            console.log('Blockchain inicializada correctamente');
        } catch (error) {
            console.error('Error inicializando blockchain:', error);
            throw error;
        }
    }

    async loadState() {
        try {
            const chainFile = path.join(this.dataDir, 'chain.json');
            const validatorsFile = path.join(this.dataDir, 'validators.json');
            
            // Cargar cadena
            if (await fileExists(chainFile)) {
                const chainData = await fs.readFile(chainFile, 'utf8');
                this.chain = JSON.parse(chainData);
                console.log(`Cadena cargada: ${this.chain.length} bloques`);
            }

            // Cargar validadores
            if (await fileExists(validatorsFile)) {
                const validatorsData = await fs.readFile(validatorsFile, 'utf8');
                const validatorsArray = JSON.parse(validatorsData);
                this.validators = new Map(validatorsArray);
                console.log(`Validadores cargados: ${this.validators.size}`);
            }
        } catch (error) {
            console.warn('No se encontró estado previo, iniciando nueva blockchain');
            this.chain = [];
            this.validators = new Map();
        }
    }

    async saveState() {
        try {
            const chainFile = path.join(this.dataDir, 'chain.json');
            const validatorsFile = path.join(this.dataDir, 'validators.json');
            
            // Guardar cadena
            await fs.writeFile(
                chainFile,
                JSON.stringify(this.chain, null, 2)
            );

            // Guardar validadores
            await fs.writeFile(
                validatorsFile,
                JSON.stringify(Array.from(this.validators.entries()), null, 2)
            );

            console.log('Estado de la blockchain guardado');
        } catch (error) {
            console.error('Error guardando estado:', error);
            throw error;
        }
    }

    async createGenesisBlock() {
        const genesisBlock = {
            index: 0,
            timestamp: Date.now(),
            transactions: [],
            previousHash: "0",
            hash: "genesis",
            validator: "genesis",
            signature: "genesis"
        };
        
        this.chain.push(genesisBlock);
        await this.saveState();
        console.log('Bloque génesis creado');
    }

    async start() {
        if (!this._isRunning) {
            await this.init();
        }
        return true;
    }

    async stop() {
        if (this._isRunning) {
            await this.saveState();
            this._isRunning = false;
        }
    }

    getState() {
        if (!this._isRunning) return 'stopped';
        if (this.isSyncing) return 'syncing';
        return 'running';
    }

    getLatestBlock() {
        if (this.chain.length === 0) {
            return null;
        }
        return this.chain[this.chain.length - 1];
    }

    // ... resto de los métodos de la blockchain
}

// Función auxiliar para verificar si un archivo existe
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export default Blockchain; 