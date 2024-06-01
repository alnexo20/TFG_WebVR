const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the React app
app.use(express.static('build'));

io.on('connection', (socket) => {
    console.log('New client connected');

    // Send a message to the client
    socket.emit('message', 'Welcome to the game!');

    // Handle messages from the client
    socket.on('message', (msg) => {
        console.log('Message from client:', msg);
        // Broadcast the message to all clients
        io.emit('message', msg);
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
