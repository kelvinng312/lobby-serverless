const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const WebSocket = require("../common/WebSocket");

const tableName = process.env.tableName;

exports.handler = async (event) => {
  const { connectionId } = event.requestContext;

  const body = JSON.parse(event.body);

  try {
    // Update self record
    let selfRecord = await Dynamo.get(connectionId, tableName);
    selfRecord.status = body.status;
    const { domainName, stage } = selfRecord;

    await Dynamo.write(selfRecord, tableName);

    // Read all record from the table
    const tableData = await Dynamo.scan(tableName);

    // Check wheather need to start a game
    let masterPlayer = null;
    if (newStatus == "Searching") {
      // Find a master player
      for (const item of tableData.Items) {
        if (item.status == "Searching" && item.isMaster) {
          masterPlayer = item;
          break;
        }
      }

      // If there isn't a master player, become the master player
      if (masterPlayer == null) {
        selfRecord.isMaster = true;

        await Dynamo.write(selfRecord, tableName);
      } else {
        masterPlayer.status = "Placing";
        await Dynamo.write(masterPlayer, tableName);

        selfRecord.status = "Placing";
        await Dynamo.write(selfRecord, tableName);
      }
    }

    // Broadcast status
    for (const item of tableData.Items) {
      await WebSocket.send({
        domainName,
        stage,
        connectionId: item.ID,
        message: JSON.stringify({ type: "status", players: data.Items }),
      });
    }

    // Start a game
    await WebSocket.send({
      domainName,
      stage,
      connectionId: masterPlayer.ID,
      message: JSON.stringify({ type: "create_session", oponentId: selfRecord.ID }),
    });

    return Responses._200({ message: "Message received" });
  } catch (error) {
    return Responses._400({ message: "Message not received" });
  }
};
