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

let currentColor = '#FFFFFF'; // Initial color

// Track client metrics
const clientMetrics = {};

// Function to append metrics to a file
const appendMetricsToFile = () => {
    const metrics = Object.entries(clientMetrics).map(([clientId, metrics]) => {
        return `Client ${clientId} metrics: ${JSON.stringify(metrics)}`;
    }).join('\n') + '\n'; // Ensure each write ends with a newline

    const filePath = path.join(__dirname, 'stats.txt');
    fs.writeFile(filePath, metrics, (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        } else {
            console.log('Metrics appended to stats.txt');
        }
    });
};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Initialize metrics for the new client
    clientMetrics[socket.id] = {
        totalLatency: 0,
        packetLoss: 0,
        packetsSent: 0,
        packetsReceived: 0,
        totalPings: 0,
        lastPingTimestamp: null,
        lastLatency: null,
        totalJitter: 0,
        jitterMeasurements: 0,
        instantaneousLatency: null
    };

    // Send the current color to the new client
    socket.emit('color', currentColor);

    // Handle color change requests
    socket.on('changeColor', (color) => {
        currentColor = color;
        io.emit('color', currentColor);
    });

    // Measure latency and jitter
    const sendPing = () => {
        socket.emit('ping');
        clientMetrics[socket.id].lastPingTimestamp = Date.now();
        console.log(`Ping sent to client ${socket.id}`);
    };

    socket.on('pong', () => {
        const now = Date.now();
        const lastPingTimestamp = clientMetrics[socket.id].lastPingTimestamp;
        if (lastPingTimestamp) {
            const latency = now - lastPingTimestamp;
            const lastLatency = clientMetrics[socket.id].lastLatency;
            clientMetrics[socket.id].totalLatency += latency;
            clientMetrics[socket.id].totalPings++;
            clientMetrics[socket.id].instantaneousLatency = latency;

            if (lastLatency !== null) {
                const jitter = Math.abs(latency - lastLatency);
                clientMetrics[socket.id].totalJitter += jitter;
                clientMetrics[socket.id].jitterMeasurements++;
                console.log(`Jitter for client ${socket.id}: ${jitter}ms`); // Log jitter
            }

            clientMetrics[socket.id].lastLatency = latency;
            console.log(`Pong received from client ${socket.id}, Latency: ${latency}ms`); // Log latency
        } else {
            console.log(`No lastPingTimestamp for client ${socket.id}`);
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
    setInterval(sendPing, 5000); // Send a ping every 5 seconds

    // Calculate packet loss, average latency, and average jitter
    setInterval(() => {
        const { packetsSent, packetsReceived, totalLatency, totalPings, totalJitter, jitterMeasurements } = clientMetrics[socket.id];
        const packetLoss = packetsSent > 0 ? ((packetsSent - packetsReceived) / packetsSent) * 100 : 0;
        const averageLatency = totalPings > 0 ? totalLatency / totalPings : 0;
        const averageJitter = jitterMeasurements > 0 ? totalJitter / jitterMeasurements : 0;
        clientMetrics[socket.id].packetLoss = packetLoss;
        clientMetrics[socket.id].averageLatency = averageLatency;
        clientMetrics[socket.id].averageJitter = averageJitter;
        console.log(`Average latency for client ${socket.id}: ${averageLatency}ms`); // Log average latency
        console.log(`Packet loss for client ${socket.id}: ${packetLoss}%`); // Log packet loss
        console.log(`Average jitter for client ${socket.id}: ${averageJitter}ms`); // Log average jitter
    }, 5000); // Calculate packet loss, average latency, and average jitter every 5 seconds

    // Append metrics to file
    setInterval(() => {
        console.log('Appending metrics to file...');
        appendMetricsToFile();
    }, 5000); // Append metrics to file every 5 seconds

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        delete clientMetrics[socket.id];
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
