/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable comma-dangle */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable semi */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { io } from "socket.io-client";

import { WebSocket } from "ws";

interface IProps {
  users_id: string;
  account_code: string;
  payload: any;
  sender: string;
}

const handleRoutes = async (req: any, res: any) => {
  const { users_id, account_code, sender, payload } = req.body;

  if (!users_id || !account_code || !sender || !payload) {
    res.status(500).send({
      message: `please check sender, receiver and payload is correct format`,
    });
    return;
  }

  if (typeof users_id !== "object" || typeof account_code !== "string") {
    res.status(500).send({
      message: `sender must string`,
    });
    return;
  }
  try {
    users_id.forEach(async (idList: string) => {
      await pushNotification({
        users_id: idList,
        account_code,
        payload,
        sender,
      });
    });
    const socketKey = users_id
      .map((e: any) => e + "_" + account_code)
      .join(",");
    res
      .status(200)
      .send({ message: `notification already send to ${socketKey}` });
  } catch {
    res.status(404).send({ message: `forbiden your are not authorized` });
  }
};

// # > connect socket and create session

const SOCKET_SERVER_URL = "localhost:3004"; //sf7dev.dataon.com";
const PATH = "/sf7-socket/ws/";

const WS_URL = `wss://${SOCKET_SERVER_URL}${PATH}`;

async function pushNotification({
  users_id,
  account_code,
  payload,
  sender,
}: IProps) {
  const socketKey = users_id + "_" + account_code;

  // =============== improve socket ============
  const ws = new WebSocket(WS_URL);
  ws.on("error", console.error);
  // # > send socket message

  const socketSend = () => {
    console.log("send message");
    const d = new Date();
    const sendingData = {
      socket_id: sender,
      data: { ...payload },
      timespan: Number(d),
      type: "message",
      socket_room: socketKey,
    };
    console.log(sendingData);
    ws.send(JSON.stringify(sendingData));
  };
  const connect = () => {
    const data = {
      socket_id: sender,
      type: "connect",
      socket_room: socketKey,
    };
    ws.send(JSON.stringify(data));
    return;
  };

  ws.on("open", function open() {
    // send data auth
    console.log("on my way");
    connect();

    socketSend();
  });

  // =============== end improve ===============
}
export { handleRoutes }; // eslint-disable-line
