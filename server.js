const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mediasoup = require('mediasoup');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Mediasoup worker setup
let worker;
(async () => {
  worker = await mediasoup.createWorker();
})();

const rooms = {};  // Store routers and transports for each room

// Express server setup
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinRoom', async ({ username, roomId }) => {
    console.log(`${username} is joining room: ${roomId}`);
    socket.join(roomId);

    let router;
    if (rooms[roomId]) {
      router = rooms[roomId].router;
    } else {
      router = await worker.createRouter({ mediaCodecs: [] });
      rooms[roomId] = { router, transports: [] };
    }

    // Create WebRTC transport
    const transport = await createWebRtcTransport(router);
    rooms[roomId].transports.push(transport);

    // Emit routerRtpCapabilities to the client
    socket.emit('routerRtpCapabilities', router.rtpCapabilities);

    socket.on('createProducerTransport', async (callback) => {
      const producerTransport = await createWebRtcTransport(router);
      rooms[roomId].transports.push(producerTransport);

      callback({
        id: producerTransport.id,
        iceParameters: producerTransport.iceParameters,
        iceCandidates: producerTransport.iceCandidates,
        dtlsParameters: producerTransport.dtlsParameters,
      });
    });

    socket.on('connectProducerTransport', async ({ dtlsParameters }) => {
      const transport = rooms[roomId].transports.find(t => t.appData.socketId === socket.id);
      await transport.connect({ dtlsParameters });
    });

    socket.on('produce', async ({ kind, rtpParameters, appData }, callback) => {
      const transport = rooms[roomId].transports.find(t => t.appData.socketId === socket.id);
      const producer = await transport.produce({ kind, rtpParameters, appData });
      callback({ id: producer.id });

      // Notify others in the room about the new producer
      socket.to(roomId).emit('newProducer', { producerId: producer.id });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
      socket.leave(roomId);
      // Clean up resources if necessary
    });
  });
});

const createWebRtcTransport = async (router) => {
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: '0.0.0.0', announcedIp: 'https://node-call.vercel.app' }], 
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  transport.on('dtlsstatechange', dtlsState => {
    if (dtlsState === 'closed') {
      transport.close();
    }
  });

  transport.on('close', () => {
    console.log('Transport closed');
  });

  return transport;
};

server.listen(3000, () => {
  console.log('Server is running on port 3000');
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
