const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const WebSocket = require("../common/WebSocket");

const tableName = process.env.tableName;

exports.handler = async (event) => {
  const { connectionId } = event.requestContext;
  const body = JSON.parse(event.body);

  console.log("event", event);
  console.log("body", body);

  try {
    // Update self record
    let selfRecord = await Dynamo.get(connectionId, tableName);
    selfRecord.playerStatus = body.playerStatus;
    const { playerStatus, domainName, stage } = selfRecord;

    if (playerStatus != "Searching") {
      selfRecord.isMaster = false;
    }

    console.log("updating self record", selfRecord);
    await Dynamo.write(selfRecord, tableName);

    // Read all record from the table
    const tableData = await Dynamo.scan(tableName);
    console.log("scaned data", tableData);

    // Check wheather need to start a game
    let masterPlayer = null;

    console.log("new playerStatus", playerStatus);
    if (playerStatus == "Searching") {
      // Find a master player
      for (const item of tableData.Items) {
        if (item.ID != selfRecord.ID) {
          if (item.playerStatus == "Searching" && item.isMaster) {
            masterPlayer = item;
            break;
          }
        }
      }

      console.log("master player", masterPlayer);

      // If there isn't a master player, become the master player
      if (masterPlayer == null) {
        selfRecord.isMaster = true;

        await Dynamo.write(selfRecord, tableName);
      } else {
        masterPlayer.playerStatus = "Placing";
        await Dynamo.write(masterPlayer, tableName);

        selfRecord.playerStatus = "Placing";
        await Dynamo.write(selfRecord, tableName);
      }
    }

    // Broadcast playerStatus
    const updatedTableData = await Dynamo.scan(tableName);
    for (const item of updatedTableData.Items) {
      await WebSocket.send({
        domainName,
        stage,
        connectionId: item.ID,
        message: JSON.stringify({ type: "status", players: updatedTableData.Items }),
      });
    }

    // Start a game
    if (masterPlayer != null) {
      await WebSocket.send({
        domainName,
        stage,
        connectionId: masterPlayer.ID,
        message: JSON.stringify({ type: "create_session", oponentId: selfRecord.ID }),
      });
    }

    return Responses._200({ message: "Message received" });
  } catch (error) {
    console.log("error", error);

    return Responses._400({ message: "Message not received" });
  }
};
