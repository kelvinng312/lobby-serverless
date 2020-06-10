const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const WebSocket = require("../common/WebSocket");

const tableName = process.env.tableName;
exports.handler = async (event) => {
  const { connectionId } = event.requestContext;
  const body = JSON.parse(event.body);
  
  console.log('event', event);
  console.log('body', body);

  const { sessionId, oponentId } = body;

  try {
    // Get self record
    let selfRecord = await Dynamo.get(connectionId, tableName);
    const { domainName, stage } = selfRecord;

    // Synchronize the oponent player with game session ID
    await WebSocket.send({
      domainName,
      stage,
      connectionId: oponentId,
      message: JSON.stringify({ type: "join_session", sessionId }),
    });

    return Responses._200({ message: "Message received" });
  } catch (error) {
    console.log('error', error);

    return Responses._400({ message: "Message not received" });
  }
};
