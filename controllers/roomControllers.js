const rooms = {};

exports.createRoom = (req, res) => {
  const { roomId } = req.body;
  if (rooms[roomId]) {
    return res.status(400).json({ message: 'Room already exists' });
  }
  rooms[roomId] = { participants: [] };
  res.status(201).json({ message: 'Room created successfully', roomId });
};

exports.getRooms = (req, res) => {
  res.status(200).json({ rooms });
};
