const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mediasoup = require('mediasoup');
const dotenv = require('dotenv');
const cors = require('cors');
const { setupMediasoup } = require('./services/mediasoupService');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rooms', require('./routes/rooms'));

// Initialize Mediasoup
setupMediasoup(io);

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// // src/server.js
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const mediasoup = require('mediasoup');
// const { createWorker } = require('./mediasoup-config');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);
// const path = require('path');

// // MediaSoup server setup
// const mediasoupServer = require('./mediasoup-config');

// // Express server setup
// app.use(express.static(path.join(__dirname, 'public')));



// io.on('connection', (socket) => {
//     console.log('New client connected');
  
//     socket.on('joinRoom', async ({ username, roomId }) => {
      
//       console.log(`${username} is joining room: ${roomId}`);
//       socket.join(roomId);
//       io.to(roomId).emit('roomJoined', { username, roomId });
  
//       socket.on('newParticipant', ({ id, stream }) => {
//         console.log('here', id, stream)
//         socket.to(roomId).emit('newParticipant', { id, stream });
//       });
  
//       socket.on('leaveRoom', ({ username, roomId }) => {
//         socket.leave(roomId);
//         socket.to(roomId).emit('participantLeft', username);
//       });
  
//       socket.on('disconnect', () => {
//         console.log('Client disconnected');
//       });
//     });
//   });

//   const createWebRtcTransport = async (router) => {
//     const transport = await router.createWebRtcTransport({
//       listenIps: [{ ip: '0.0.0.0', announcedIp: 'YOUR_SERVER_IP' }],
//       enableUdp: true,
//       enableTcp: true,
//       preferUdp: true,
//     });

//     transport.on('dtlsstatechange', dtlsState => {
//       if (dtlsState === 'closed') {
//         transport.close();
//       }
//     });

//     transport.on('close', () => {
//       console.log('Transport closed');
//     });

//     return transport;
//   };

// server.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const { createWorkerAndRouter } = require('./mediasoup-config');
// const path = require('path');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);
// app.use(express.static(path.join(__dirname, 'public')));

// let router;

// (async () => {
//   const { router: initializedRouter } = await createWorkerAndRouter();
//   router = initializedRouter;

//   // Start listening for socket connections only after router is ready
//   io.on('connection', (socket) => {
//     console.log('New client connected');

//     socket.on('joinRoom', async (roomId, callback) => {
//       console.log(`Client joined room: ${roomId}`);

//       // Ensure router is available before creating a transport
//       if (!router) {
//         console.error('Router is not initialized');
//         return;
//       }

//       // Create a transport for the client
//       const transport = await createWebRtcTransport(router);
//       // Send transport options to the client
//       callback({ transportOptions: transport });

//       // Handle additional signaling events here
//     });

//     socket.on('disconnect', () => {
//       console.log('Client disconnected');
//     });
//   });
// })();

// const createWebRtcTransport = async (router) => {
//   const transport = await router.createWebRtcTransport({
//     listenIps: [{ ip: '0.0.0.0', announcedIp: 'YOUR_SERVER_IP' }],
//     enableUdp: true,
//     enableTcp: true,
//     preferUdp: true,
//   });

//   transport.on('dtlsstatechange', (dtlsState) => {
//     if (dtlsState === 'closed') {
//       transport.close();
//     }
//   });

//   transport.on('close', () => {
//     console.log('Transport closed');
//   });

//   return transport;
// };

// server.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });
