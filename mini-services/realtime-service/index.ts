import { Server, Socket } from "socket.io";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface OnlineUser {
  id: string;
  role: string;
  name?: string;
  socketId: string;
}

interface ProgressUpdatePayload {
  studentId: string;
  lessonId: string;
  progressPercent: number;
  completed: boolean;
}

interface ScreenshotPayload {
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonTitle: string;
  screenshotUrl: string;
}

interface MessagePayload {
  senderId: string;
  senderName: string;
  receiverId: string;
  body: string;
  timestamp: string;
}

interface ClassStartedPayload {
  lessonId: string;
  lessonTitle: string;
  teacherId: string;
  roomName: string;
}

interface ClassEndedPayload {
  lessonId: string;
}

// ─────────────────────────────────────────────
// Server bootstrap
// ─────────────────────────────────────────────

const io = new Server({
  cors: { origin: "*" },
});

const onlineUsers = new Map<string, OnlineUser>();
// userId → Set of lessonIds the user is associated with (for class broadcasts)
const userLessons = new Map<string, Set<string>>();

/**
 * Get all teachers currently online
 */
function getTeacherSockets(): Socket[] {
  const teachers: Socket[] = [];
  for (const [userId, user] of onlineUsers) {
    if (user.role === "teacher") {
      const sock = io.sockets.sockets.get(user.socketId);
      if (sock) teachers.push(sock);
    }
  }
  return teachers;
}

/**
 * Get all student sockets currently online
 */
function getStudentSockets(): Socket[] {
  const students: Socket[] = [];
  for (const [userId, user] of onlineUsers) {
    if (user.role === "student") {
      const sock = io.sockets.sockets.get(user.socketId);
      if (sock) students.push(sock);
    }
  }
  return students;
}

// ─────────────────────────────────────────────
// Connection handling
// ─────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log(`[connect] socket=${socket.id}`);

  // ── Handshake: client sends { userId, role, name? } ──────────
  socket.on(
    "auth",
    (data: { userId: string; role: string; name?: string }) => {
      if (!data?.userId || !data?.role) {
        console.warn(`[auth:reject] socket=${socket.id} missing userId or role`);
        socket.emit("auth:error", { message: "userId and role are required" });
        return;
      }

      // If this userId already has another socket, disconnect the old one
      const existing = onlineUsers.get(data.userId);
      if (existing && existing.socketId !== socket.id) {
        const oldSock = io.sockets.sockets.get(existing.socketId);
        if (oldSock) {
          console.log(
            `[auth:replace] userId=${data.userId} old=${existing.socketId} new=${socket.id}`
          );
          oldSock.disconnect(true);
        }
      }

      const user: OnlineUser = {
        id: data.userId,
        role: data.role,
        name: data.name,
        socketId: socket.id,
      };
      onlineUsers.set(data.userId, user);

      console.log(
        `[auth:ok] userId=${data.userId} role=${data.role} socket=${socket.id}`
      );

      // Emit student online status to teachers
      if (data.role === "student") {
        for (const teacher of getTeacherSockets()) {
          teacher.emit("student:online", {
            id: user.id,
            name: user.name,
            socketId: user.socketId,
          });
        }
      }

      // Broadcast updated online count
      io.emit("online:count", { count: onlineUsers.size });

      socket.emit("auth:success", { userId: data.userId, role: data.role });
    }
  );

  // ── Progress Updates ─────────────────────────────────────────
  socket.on("progress:update", (data: ProgressUpdatePayload) => {
    if (!data?.studentId || !data?.lessonId) {
      console.warn("[progress:update:reject] missing studentId or lessonId");
      return;
    }

    console.log(
      `[progress:update] student=${data.studentId} lesson=${data.lessonId} progress=${data.progressPercent}% completed=${data.completed}`
    );

    const payload = {
      studentId: data.studentId,
      lessonId: data.lessonId,
      progressPercent: data.progressPercent,
      completed: data.completed,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all teachers
    for (const teacher of getTeacherSockets()) {
      teacher.emit("progress:updated", payload);
    }
  });

  // ── Screenshot Notification ──────────────────────────────────
  socket.on("screenshot:new", (data: ScreenshotPayload) => {
    if (!data?.studentId || !data?.lessonId || !data?.screenshotUrl) {
      console.warn(
        "[screenshot:new:reject] missing studentId, lessonId, or screenshotUrl"
      );
      return;
    }

    console.log(
      `[screenshot:new] student=${data.studentName} lesson=${data.lessonTitle}`
    );

    const payload = {
      studentId: data.studentId,
      studentName: data.studentName || "Unknown",
      lessonId: data.lessonId,
      lessonTitle: data.lessonTitle || "Unknown",
      screenshotUrl: data.screenshotUrl,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all teachers
    for (const teacher of getTeacherSockets()) {
      teacher.emit("screenshot:received", payload);
    }
  });

  // ── Message Notification (direct to receiver) ────────────────
  socket.on("message:new", (data: MessagePayload) => {
    if (!data?.senderId || !data?.receiverId || !data?.body) {
      console.warn(
        "[message:new:reject] missing senderId, receiverId, or body"
      );
      return;
    }

    console.log(
      `[message:new] from=${data.senderId} to=${data.receiverId}`
    );

    const payload = {
      senderId: data.senderId,
      senderName: data.senderName || "Unknown",
      receiverId: data.receiverId,
      body: data.body,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    // Emit to the specific receiver if they are online
    const receiver = onlineUsers.get(data.receiverId);
    if (receiver) {
      const receiverSocket = io.sockets.sockets.get(receiver.socketId);
      if (receiverSocket) {
        receiverSocket.emit("message:notification", payload);
      }
    }

    // Acknowledge back to sender
    socket.emit("message:sent", {
      receiverId: data.receiverId,
      timestamp: payload.timestamp,
    });
  });

  // ── Class Started ────────────────────────────────────────────
  socket.on("class:started", (data: ClassStartedPayload) => {
    if (!data?.lessonId || !data?.teacherId) {
      console.warn("[class:started:reject] missing lessonId or teacherId");
      return;
    }

    console.log(
      `[class:started] lesson=${data.lessonId} teacher=${data.teacherId} room=${data.roomName}`
    );

    // Track that this teacher started this lesson
    if (!userLessons.has(data.teacherId)) {
      userLessons.set(data.teacherId, new Set());
    }
    userLessons.get(data.teacherId)!.add(data.lessonId);

    const payload = {
      lessonId: data.lessonId,
      lessonTitle: data.lessonTitle || "Untitled",
      teacherId: data.teacherId,
      roomName: data.roomName || "",
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all connected students
    for (const student of getStudentSockets()) {
      student.emit("class:started", payload);
    }

    // Also broadcast to all teachers
    for (const teacher of getTeacherSockets()) {
      teacher.emit("class:started", payload);
    }
  });

  // ── Class Ended ──────────────────────────────────────────────
  socket.on("class:ended", (data: ClassEndedPayload) => {
    if (!data?.lessonId) {
      console.warn("[class:ended:reject] missing lessonId");
      return;
    }

    console.log(`[class:ended] lesson=${data.lessonId}`);

    const payload = {
      lessonId: data.lessonId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to ALL connected sockets
    io.emit("class:ended", payload);
  });

  // ── Get Online Students ──────────────────────────────────────
  socket.on("get:online-students", () => {
    const students: Array<{
      id: string;
      name?: string;
      socketId: string;
    }> = [];

    for (const [userId, user] of onlineUsers) {
      if (user.role === "student") {
        students.push({
          id: user.id,
          name: user.name,
          socketId: user.socketId,
        });
      }
    }

    console.log(
      `[get:online-students] count=${students.length} requested by socket=${socket.id}`
    );
    socket.emit("online-students:list", students);
  });

  // ── Get All Online Users ─────────────────────────────────────
  socket.on("get:online-users", () => {
    const users: Array<OnlineUser> = Array.from(onlineUsers.values());
    socket.emit("online-users:list", users);
  });

  // ── Get Online Count ─────────────────────────────────────────
  socket.on("get:online-count", () => {
    socket.emit("online:count", { count: onlineUsers.size });
  });

  // ── Disconnect ───────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    // Find the user associated with this socket
    let disconnectedUser: OnlineUser | undefined;
    let disconnectedUserId: string | undefined;

    for (const [userId, user] of onlineUsers) {
      if (user.socketId === socket.id) {
        disconnectedUser = user;
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUser && disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);

      console.log(
        `[disconnect] userId=${disconnectedUserId} role=${disconnectedUser.role} socket=${socket.id} reason=${reason}`
      );

      // Notify teachers if a student went offline
      if (disconnectedUser.role === "student") {
        for (const teacher of getTeacherSockets()) {
          teacher.emit("student:offline", {
            id: disconnectedUser.id,
            name: disconnectedUser.name,
          });
        }
      }

      // Broadcast updated online count
      io.emit("online:count", { count: onlineUsers.size });
    } else {
      console.log(
        `[disconnect] unauthenticated socket=${socket.id} reason=${reason}`
      );
    }
  });

  // ── Error handling ───────────────────────────────────────────
  socket.on("error", (err) => {
    console.error(`[error] socket=${socket.id}`, err.message);
  });
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────

const PORT = 3003;
io.listen(PORT);
console.log(`🟢 Chambari Realtime Service running on port ${PORT}`);
