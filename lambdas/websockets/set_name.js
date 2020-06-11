const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const WebSocket = require("../common/WebSocket");

const tableName = process.env.tableName;

exports.handler = async (event) => {
  const { connectionId } = event.requestContext;
  const body = JSON.parse(event.body);

  console.log('event', event);
  console.log('body', body);

  try {
    // Get Visitor count
    let maxVisitorIndex = 0;
    const tableData = await Dynamo.scan(tableName);
    for (const item of tableData.Items) {
      if (item.name.includes("Visitor")) {
        const curVisitorIndex = parseInt(item.name.replace("Visitor", ""));
        if (curVisitorIndex > maxVisitorIndex) {
          maxVisitorIndex = curVisitorIndex;
        }
      }
    }

    // Update new name if he is a visitor
    let newName = body.name;
    if (newName == "Visitor") {
      maxVisitorIndex++;
      newName += maxVisitorIndex;
    }

    // Update self record
    let selfRecord = await Dynamo.get(connectionId, tableName);
    selfRecord.name = newName;
    const { domainName, stage } = selfRecord;
    await Dynamo.write(selfRecord, tableName);


    // Answer with Id
    await WebSocket.send({
        domainName,
        stage,
        connectionId,
        message: JSON.stringify({ type: "ans_name", name: newName, Id: connectionId }),
      });

    return Responses._200({ message: "Message received" });
  } catch (error) {
    console.log('error', error);

    return Responses._400({ message: "Message not received" });
  }
};
