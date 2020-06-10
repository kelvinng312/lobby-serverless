const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const WebSocket = require("../common/WebSocket");

const tableName = process.env.tableName;

exports.handler = async (event) => {
  const { connectionId } = event.requestContext;

  console.log("event", event);

  try {
    // Get self record
    let selfRecord = await Dynamo.get(connectionId, tableName);
    const { domainName, stage } = selfRecord;

    // Broadcast status
    const tableData = await Dynamo.scan(tableName);
    for (const item of tableData.Items) {
      await WebSocket.send({
        domainName,
        stage,
        connectionId: item.ID,
        message: JSON.stringify({ type: "status", players: tableData.Items }),
      });
    }
    return Responses._200({ message: "Successfully sent status messages" });
  } catch (error) {
    console.log("error", error);

    return Responses._400({ message: "Failed to send status messages" });
  }
};
