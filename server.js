const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Create HTTP server
const server = require('http').createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);
    
    ws.on('message', (message) => {
        clients.forEach((client) => {
            try {
                const msg = message.toString();
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(msg);
                }
            } catch (error) {
                console.error('error:', error);
            }
        });
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});