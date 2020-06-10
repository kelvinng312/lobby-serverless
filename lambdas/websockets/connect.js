const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");

const tableName = process.env.tableName;

exports.handler = async event => {
    console.log('event', event);

    const { connectionId, domainName, stage } = event.requestContext;

    const connectionData = {
        ID: connectionId,
        domainName,
        stage,

        name: "-",
        status: "Normal",
        isMaster: false
    };

    await Dynamo.write(connectionData, tableName);

    return Responses._200({ message: 'Connected' });
};
