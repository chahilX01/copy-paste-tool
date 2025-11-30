const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'clipboard-data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ text: '', timestamp: Date.now() }));
}

// Get clipboard text
app.get('/api/clipboard', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
});

// Save clipboard text
app.post('/api/clipboard', (req, res) => {
    const { text } = req.body;
    const data = { text, timestamp: Date.now() };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    
    // Broadcast to all connected clients
    io.emit('textUpdate', data);
    
    res.json({ success: true, data });
});

// WebSocket connection
io.on('connection', (socket) => {
    console.log('Device connected:', socket.id);
    
    // Send current text when client connects
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    socket.emit('textUpdate', data);
    
    // Handle real-time text updates
    socket.on('updateText', (text) => {
        const data = { text, timestamp: Date.now() };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data));
        
        // Broadcast to all other clients
        socket.broadcast.emit('textUpdate', data);
    });
    
    socket.on('disconnect', () => {
        console.log('Device disconnected:', socket.id);
    });
});

// Get local IP addresses
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (let iface in interfaces) {
        for (let alias of interfaces[iface]) {
            if (alias.family === 'IPv4' && !alias.internal) {
                addresses.push(alias.address);
            }
        }
    }
    return addresses;
}

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n=================================');
    console.log('Copy Paste Server is running!');
    console.log('Real-time sync enabled ⚡');
    console.log('=================================\n');
    console.log('Access from this computer:');
    console.log(`  http://localhost:${PORT}\n`);
    console.log('Access from your phone or other devices:');
    const ips = getLocalIPs();
    ips.forEach(ip => {
        console.log(`  http://${ip}:${PORT}`);
    });
    console.log('\n=================================\n');
});
