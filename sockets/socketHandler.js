const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("joinRoom", ({ appointmentId, roomId }) => {
      const targetRoom = roomId || appointmentId;

      if (!targetRoom) {
        return;
      }

      socket.join(targetRoom);
      socket.emit("joinedRoom", {
        roomId: targetRoom,
        message: `Joined room ${targetRoom}`
      });
    });

    socket.on("sendMessage", ({ roomId, appointmentId, message, senderId }) => {
      const targetRoom = roomId || appointmentId;

      if (!targetRoom || !message) {
        return;
      }

      const payload = {
        roomId: targetRoom,
        message,
        senderId: senderId || null,
        timestamp: new Date().toISOString()
      };

      io.to(targetRoom).emit("receiveMessage", payload);
    });

    socket.on("slotBooked", (data) => {
      io.emit("slotBooked", data);
    });

    socket.on("slotUpdated", (data) => {
      io.emit("slotUpdated", data);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = registerSocketHandlers;