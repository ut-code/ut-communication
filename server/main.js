import express from "express";
import expressWs from "express-ws";
import * as database from "./database.js";
const wsInstance = expressWs(express());
const app = wsInstance.app;

app.use(express.static("dist"));

app.ws("/", (ws, req) => {
  const onError = (message) => {
    wsInstance.getWss("/").clients.forEach((c) => {
      c.send(JSON.stringify({
        type: "error",
        message: message,
      }));
    });
  };
  const broadcast = async () => {
    const messages = await database.getMessageAll(onError);
    wsInstance.getWss("/").clients.forEach((c) => {
      c.send(JSON.stringify({
        type: "messageAll",
        messages: messages,
      }));
    });
  };
  ws.on("message", async (msg) => {
    console.log(msg);
    const json = JSON.parse(msg);
    if (json.type === "createMessage") {
      await database.createMessage(json, onError);
      await broadcast();
    } else if (json.type === "fetch") {
      const messages = await database.getMessageAll(onError);
      ws.send(JSON.stringify({
        type: "messageAll",
        messages: messages,
      }));
    }
  });
  // console.log('socket', req.testing);
});

const port = process.env["PORT"] || 3000;
console.log(`http://localhost:${port}/`);
app.listen(port);
