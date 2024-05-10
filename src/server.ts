/* eslint-disable semi */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import app from "./app";
// import { createServer } from "https";
import { createServer } from "http";
import debug from "debug";
import { WebSocket, WebSocketServer } from "ws";
const uuidv4 = require("uuid").v4;
import { readFileSync } from "fs";

// Spinning the http server and the WebSocket server.

// I'm maintaining all active connections in this object
const clients: any = {};
// I'm maintaining all active users in this object
const users: any = {};
// The current editor content is maintained here.

function broadcastMessage(json: object, clientsList: any[]) {
  // We are sending the current data to all connected clients
  const data = JSON.stringify(json);

  if (clientsList) {
    clientsList.forEach((userId) => {
      console.log("userid from list");
      console.log(userId);
      let client = clients[userId];
      if (clients[userId] && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

function handleMessage(message: any, userId: any) {
  const dataFromClient = JSON.parse(message.toString());

  // check user allready registered or not
  // if user allready registered send message
  // if user not registered register first

  if (
    users[userId] &&
    "socket_room" in users[userId] &&
    "data" in dataFromClient
  ) {
    const room = users[userId].socket_room;
    const filteredKeys = Object.keys(users).filter(
      (key) => users[key].socket_room === room
    );

    const json = {
      type: "message",
      senderId: users[userId].socket_id,
      data: dataFromClient.data,
    };
    // console.log("Json", json, filteredKeys);
    broadcastMessage(json, filteredKeys);
  } else {
    // check reconnect
    //console.log(dataFromClient);
    if (
      dataFromClient &&
      "type" in dataFromClient &&
      dataFromClient.type === "connect" &&
      "socket_room" in dataFromClient &&
      "socket_id" in dataFromClient
    ) {
      console.log("auth success");
      users[userId] = dataFromClient;
    } else {
      return 0;
    }
  }
  //
}

function handleDisconnect(userId: any) {
  console.log(`${userId} disconnected.`);
  const json: any = { type: "disconnect" };
  const username = users[userId]?.username || userId;
  // userActivity.push(`${username} left the document`);
  json.data = { users, userActivity: [`${username} left the document`] };
  delete clients[userId];
  delete users[userId];
  // broadcastMessage(json);
}

const log = debug("ts-express-esbuild:server");

const normalizePort = (val: string) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val; // named pipe
  if (port >= 0) return port; // port number
  return false;
};

const port = normalizePort(process.env.PORT ?? "3004");

/**
 * Event listener for HTTP server "error" event.
 */

const onError = (error: any) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind =
    typeof port === "string" ? `Pipe ${port}` : `Port ${port as number}`;

  // handle specific listen errors with friendly messages
  if (error.code === "EACCES") {
    console.error(`${bind} requires elevated privileges`);
    process.exit(1);
  } else if (error.code === "EADDRINUSE") {
    console.error(`${bind} is already in use`);
    process.exit(1);
  } else {
    throw error;
  }
};

/**
 * Event listener for HTTP server "listening" event.
 */

const onListening = (server: any) => {
  let bind = "unknown";
  const addr = server.address();
  if (typeof addr === "string") {
    bind = `pipe ${addr}`;
  } else if (addr) {
    bind = `port ${addr.port}`;
  }

  log(`Listening on ${bind}`);
};

// eslint-disable-next-line @typescript-eslint/require-await
const option = {
  cert: readFileSync("ssl/dataonssl.pem"),
  key: readFileSync("ssl/dataonkey.key"),
};

const start = async () => {
  app.set("port", port);

  // const server = createServer(option, app);
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  // A new client connection request received
  server.on("upgrade", function upgrade(request: any, socket, head) {
    const { pathname } = new URL(request.url, "wss://base.url");

    console.log(pathname);

    if (pathname === "/sf7-socket/ws") {
      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", function (connection: any) {
    // Generate a unique code for every user
    connection.on("error", console.error);

    const userId = uuidv4();
    console.log("Received a new connection");

    // Store the new connection and handle messages
    clients[userId] = connection;
    console.log(`${userId} connected.`);
    connection.on("message", (message: any) => handleMessage(message, userId));
    // User disconnected
    connection.on("close", () => handleDisconnect(userId));
  });

  /*
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });
  io.on("connection", (socket: any) => {
    console.log(`Client ${socket.id} connected`);

    // Join a conversation
    const { roomId } = socket.handshake.query;
    socket.join(roomId);

    // Listen for new messages
    socket.on(NEW_CHAT_MESSAGE_EVENT, (data: any) => {
      io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
    });

    // Leave the room if the user closes the socket
    socket.on("disconnect", () => {
      console.log(`Client ${socket.id} diconnected`);
      socket.leave(roomId);
    });
  });
  */

  server.listen(port);
  server.on("error", (error: any) => {
    onError(error);
  });
  server.on("listening", () => {
    onListening(server);
  });
};

start().catch((err: any) => {
  log(err);
  process.exit(1);
});
