const Responses = require("../common/API_Responses");
const WebSocket = require("../common/WebSocket");

exports.handler = async (event) => {
  const { connectionId } = event.requestContext;
  const body = JSON.parse(event.body);
  const { sessionId, oponentId } = body;

  try {
    // Synchronize the oponent player with game session ID
    await WebSocket.send({
      domainName,
      stage,
      oponentId,
      message: JSON.stringify({ type: "join_session", sessionId }),
    });

    return Responses._200({ message: "Message received" });
  } catch (error) {
    return Responses._400({ message: "Message not received" });
  }
};
