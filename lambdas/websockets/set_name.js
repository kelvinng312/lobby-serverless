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
    // Update self record
    let selfRecord = await Dynamo.get(connectionId, tableName);
    selfRecord.name = body.name;
    const { domainName, stage } = selfRecord;

    await Dynamo.write(selfRecord, tableName);

    // Answer with Id
    await WebSocket.send({
        domainName,
        stage,
        connectionId,
        message: JSON.stringify({ type: "ans_name", Id: connectionId }),
      });

    return Responses._200({ message: "Message received" });
  } catch (error) {
    console.log('error', error);

    return Responses._400({ message: "Message not received" });
  }
};
