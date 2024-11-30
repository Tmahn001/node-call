module.exports = {
  worker: {
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: 'debug',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
  },
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
    ],
  },
};


// const mediasoup = require('mediasoup');

// const workerSettings = {
//   logLevel: 'warn',
//   rtcMinPort: 10000,
//   rtcMaxPort: 10100,
// };

// const mediaCodecs = [
//   {
//     kind: 'audio',
//     mimeType: 'audio/opus',
//     clockRate: 48000,
//     channels: 2,
//   },
//   {
//     kind: 'video',
//     mimeType: 'video/VP8',
//     clockRate: 90000,
//   },
// ];

// let worker;
// let router;

// const createWorkerAndRouter = async () => {
//   worker = await mediasoup.createWorker(workerSettings);
//   worker.on('died', () => {
//     console.error('MediaSoup worker has died');
//     process.exit(1);
//   });

//   router = await worker.createRouter({ mediaCodecs });
//   return { worker, router };
// };

// module.exports = { createWorkerAndRouter };
