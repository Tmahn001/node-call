document.getElementById('join-button').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const roomId = document.getElementById('room-id').value;
  
    if (username && roomId) {
      const socket = io();
      socket.emit('joinRoom', { username, roomId });
  
      document.getElementById('join-screen').style.display = 'none';
      document.getElementById('controls').style.display = 'block';
      document.getElementById('participant-view').style.display = 'block';
  
      let localStream;
      let audioEnabled = true;
      let videoEnabled = true;
  
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        addParticipantVideo('local', localStream);
  
        // Get RTP Capabilities from the server
        const rtpCapabilities = await new Promise(resolve => {
          socket.on('routerRtpCapabilities', resolve);
        });
  
        // Create producer transport on the server
        const transportInfo = await new Promise(resolve => {
          socket.emit('createProducerTransport', resolve);
        });
  
        // Create a local WebRTC transport
        const producerTransport = createWebRtcTransport(transportInfo);
  
        // Connect the transport
        await producerTransport.connect({ dtlsParameters: transportInfo.dtlsParameters });
  
        // Produce the video stream
        const videoTrack = localStream.getVideoTracks()[0];
        const videoProducer = await producerTransport.produce({ track: videoTrack });
  
        // Emit the producer ID to the server for broadcasting
        socket.emit('produce', { kind: videoTrack.kind, rtpParameters: videoProducer.rtpParameters });
  
        // Listen for new participants
        socket.on('newProducer', async ({ producerId }) => {
          const consumerTransportInfo = await new Promise(resolve => {
            socket.emit('createConsumerTransport', resolve);
          });
  
          const consumerTransport = createWebRtcTransport(consumerTransportInfo);
          await consumerTransport.connect({ dtlsParameters: consumerTransportInfo.dtlsParameters });
  
          const consumer = await socket.emit('consume', {
            producerId,
            rtpCapabilities: rtpCapabilities
          });
  
          const remoteStream = new MediaStream();
          remoteStream.addTrack(consumer.track);
          addParticipantVideo(producerId, remoteStream);
        });
  
        // Listen for participant leaving
        socket.on('participantLeft', id => {
          removeParticipantVideo(id);
        });
  
      } catch (error) {
        console.error('Error accessing media devices.', error);
        alert('Could not access your camera and microphone. Please check your permissions.');
      }
  
      document.getElementById('mute-button').addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        localStream.getAudioTracks()[0].enabled = audioEnabled;
        document.getElementById('mute-button').textContent = audioEnabled ? 'Mute' : 'Unmute';
      });
  
      document.getElementById('video-button').addEventListener('click', () => {
        videoEnabled = !videoEnabled;
        localStream.getVideoTracks()[0].enabled = videoEnabled;
        document.getElementById('video-button').textContent = videoEnabled ? 'Stop Video' : 'Start Video';
      });
  
      document.getElementById('leave-button').addEventListener('click', () => {
        socket.emit('leaveRoom', { username, roomId });
        localStream.getTracks().forEach(track => track.stop());
        socket.disconnect();
  
        document.getElementById('join-screen').style.display = 'block';
        document.getElementById('controls').style.display = 'none';
        document.getElementById('participant-view').style.display = 'none';
        document.getElementById('participant-view').innerHTML = '';
      });
  
      socket.on('roomJoined', (data) => {
        console.log(`Joined room ${data.roomId} as ${data.username}`);
      });
  
      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        alert('Connection failed. Please try again.');
      });
    } else {
      alert('Please enter your name and room ID');
    }
  });
  
  const addParticipantVideo = (id, stream) => {
    const videoElement = document.createElement('video');
    videoElement.id = id;
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    document.getElementById('participant-view').appendChild(videoElement);
  };
  
  const removeParticipantVideo = (id) => {
    const videoElement = document.getElementById(id);
    if (videoElement) {
      videoElement.srcObject.getTracks().forEach(track => track.stop());
      videoElement.remove();
    }
  };
  
  // Helper function to create a WebRTC transport
  const createWebRtcTransport = (transportInfo) => {
    const transport = new RTCPeerConnection({
      iceServers: transportInfo.iceCandidates,
    });
  
    transport.setConfiguration({
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 0,
    });
  
    transport.onicecandidate = ({ candidate }) => {
      if (candidate) {
        // Send new ICE candidate to the server
        socket.emit('iceCandidate', { candidate });
      }
    };
  
    return transport;
  };
  