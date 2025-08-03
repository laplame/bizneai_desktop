import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function generateKeys() {
    // Crear directorio para las claves si no existe
    const keyDir = join(__dirname, '..', 'validator-keys');
    if (!fs.existsSync(keyDir)) {
        fs.mkdirSync(keyDir, { recursive: true });
    }

    // Generar par de claves
    const privateKey = crypto.randomBytes(32).toString('hex');
    const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');

    // Guardar claves en archivos
    fs.writeFileSync(join(keyDir, 'private.key'), privateKey);
    fs.writeFileSync(join(keyDir, 'public.key'), publicKey);

    console.log('Claves generadas exitosamente:');
    console.log('Dirección pública:', publicKey);
    console.log('Clave privada guardada en validator-keys/private.key');
}

generateKeys().catch(console.error); 