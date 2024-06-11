const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'https://tfg-web-vr-client.vercel.app', 
        methods: ['GET', 'POST']
    }
});

app.use(cors({
    origin: 'https://tfg-web-vr-client.vercel.app'
}));

// Example API endpoint
app.get('/api/some-endpoint', (req, res) => {
    res.send({ message: 'Hello from server!' });
});

let currentColor = '#FFFFFF'; // Initial color

// Track client metrics
const clientMetrics = {};

// Function to write metrics to a file
const writeMetricsToFile = () => {
    const metrics = Object.entries(clientMetrics).map(([clientId, metrics]) => {
        return `Client ${clientId} metrics: ${JSON.stringify(metrics)}`;
    }).join('\n');

    const filePath = path.join(__dirname, 'stats.txt');
    fs.writeFile(filePath, metrics, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Metrics written to stats.txt');
        }
    });
};

io.on('connection', (socket) => {
    console.log('New client connected');

    // Initialize metrics for the new client
    clientMetrics[socket.id] = {
        latency: 0,
        packetLoss: 0,
        packetsSent: 0,
        packetsReceived: 0,
        lastPingTimestamp: null
    };

    // Send the current color to the new client
    socket.emit('color', currentColor);

    // Handle color change requests
    socket.on('changeColor', (color) => {
        currentColor = color;
        io.emit('color', currentColor);
    });

    // Measure latency
    socket.on('ping', () => {
        clientMetrics[socket.id].lastPingTimestamp = Date.now();
    });

    socket.on('pong', () => {
        const now = Date.now();
        const lastPingTimestamp = clientMetrics[socket.id].lastPingTimestamp;
        if (lastPingTimestamp) {
            const latency = now - lastPingTimestamp;
            clientMetrics[socket.id].latency = latency;
        }
    });

    // Track packets sent and received
    socket.on('packetReceived', () => {
        clientMetrics[socket.id].packetsReceived++;
    });

    const sendPacket = () => {
        if (socket.connected) {
            clientMetrics[socket.id].packetsSent++;
            socket.emit('packet', { id: clientMetrics[socket.id].packetsSent });
        }
    };

    setInterval(sendPacket, 1000); // Send a packet every second

    // Calculate packet loss
    setInterval(() => {
        const { packetsSent, packetsReceived } = clientMetrics[socket.id];
        const packetLoss = ((packetsSent - packetsReceived) / packetsSent) * 100;
        clientMetrics[socket.id].packetLoss = packetLoss;
    }, 5000); // Calculate packet loss every 5 seconds

    // Write metrics to file
    setInterval(writeMetricsToFile, 5000); // Write metrics to file every 5 seconds

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        delete clientMetrics[socket.id];
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
