const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para descargas
app.get('/download/:file', (req, res) => {
    const downloadDir = path.join(__dirname, 'download');
    const filePath = path.join(downloadDir, req.params.file);
    
    // Verificar si el archivo existe
    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error al descargar archivo:', err);
                res.status(500).json({ error: 'Error al descargar archivo' });
            }
        });
    } else {
        res.status(404).json({ error: 'Archivo no encontrado' });
    }
});

// API para obtener información de descargas
app.get('/api/downloads', (req, res) => {
    const downloadDir = path.join(__dirname, 'download');
    const infoFile = path.join(downloadDir, 'download-info.json');
    
    if (fs.existsSync(infoFile)) {
        try {
            const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
            res.json(info);
        } catch (error) {
            res.status(500).json({ error: 'Error al leer información de descargas' });
        }
    } else {
        res.status(404).json({ error: 'Información de descargas no encontrada' });
    }
});

// Listar archivos disponibles para descarga
app.get('/api/downloads/list', (req, res) => {
    const downloadDir = path.join(__dirname, 'download');
    
    if (fs.existsSync(downloadDir)) {
        try {
            const files = fs.readdirSync(downloadDir)
                .filter(file => file.endsWith('.zip') || file.endsWith('.tar.gz'))
                .map(file => {
                    const filePath = path.join(downloadDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        size: stats.size,
                        sizeFormatted: formatBytes(stats.size),
                        url: `/download/${file}`,
                        lastModified: stats.mtime
                    };
                });
            res.json({ files });
        } catch (error) {
            res.status(500).json({ error: 'Error al listar archivos' });
        }
    } else {
        res.json({ files: [] });
    }
});

// Función para formatear bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Redirigir /dist al paquete exportable (mantener compatibilidad)
app.get('/dist/:file', (req, res) => {
    const filePath = path.join(__dirname, '..', 'dist', req.params.file);
    res.download(filePath);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Luxae Landing Page',
        timestamp: new Date().toISOString(),
        downloads: {
            available: fs.existsSync(path.join(__dirname, 'download')),
            count: fs.existsSync(path.join(__dirname, 'download')) ? 
                fs.readdirSync(path.join(__dirname, 'download')).length : 0
        }
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Landing Page corriendo en: http://localhost:${PORT}`);
    console.log(`📦 Descargas disponibles en: http://localhost:${PORT}/download/`);
    console.log(`📊 API de descargas: http://localhost:${PORT}/api/downloads`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
}); 