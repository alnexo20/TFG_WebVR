const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Serve the React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

let currentColor = '#FFFFFF'; // Initial color

io.on('connection', (socket) => {
    console.log('New client connected');

    // Send the current color to the new client
    socket.emit('color', currentColor);

    // Handle color change requests
    socket.on('changeColor', (color) => {
        currentColor = color;
        // Broadcast the new color to all clients
        io.emit('color', currentColor);
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
