const mediasoup = require('mediasoup');
const mediasoupConfig = require('../config/mediasoupConfig');

let workers = [];
let nextWorkerIndex = 0;
const rooms = {};

async function setupMediasoup(io) {
  console.log('Setting up Mediasoup...');
  
  // Create workers
  for (let i = 0; i < 2; i++) {
    const worker = await mediasoup.createWorker(mediasoupConfig.worker);
    worker.on('died', () => {
      console.error(`Mediasoup worker died, exiting process`);
      process.exit(1);
    });
    workers.push(worker);
  }

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("joinRoom", async (data) => {
      const { roomId } = data;
      console.log(`Attempting to join room: ${roomId}`);
    
      if (!roomId) {
        socket.emit("joinRoomError", { message: "Room ID is invalid" });
        return;
      }
    
      if (!rooms[roomId]) {
        // Create a new room
        rooms[roomId] = { users: [] };
      }
    
      rooms[roomId].users.push(socket.id); // Add user to room
      console.log(`User ${socket.id} joined room ${roomId}`);
    
      // Acknowledge successful room join
      socket.emit("joinRoomSuccess", { success: true, roomId });

      try {
        // Get router for the room and fetch RTP capabilities
        const router = await getRouterForRoom(roomId);
        const routerRtpCapabilities = router.rtpCapabilities;

        // Send RTP capabilities to the client
        socket.emit("routerRtpCapabilities", routerRtpCapabilities);
      } catch (error) {
        console.error("Error while getting router for room:", error);
        socket.emit("joinRoomError", { message: "Error while joining the room" });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

async function getRouterForRoom(roomId) {
  const worker = getNextWorker();
  const router = await worker.createRouter({ mediaCodecs: mediasoupConfig.router.mediaCodecs });
  return router;
}

function getNextWorker() {
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

module.exports = { setupMediasoup };
