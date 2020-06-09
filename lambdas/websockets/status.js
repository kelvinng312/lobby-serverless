const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WebSocket = require('../common/WebSocket');

const tableName = process.env.tableName;

exports.handler = async event => {
    const { connectionId, domainName, stage } = event.requestContext;

    try {
        const data = await Dynamo.scan(tableName);
        for (const item of data.Items) {
            await WebSocket.send({
                domainName,
                stage,
                connectionId: item.ID,
                message: JSON.stringify({ type: "status", sender: connectionId, content: data.Items.length})
            });
        }
        return Responses._200({ message: 'Successfully sent status messages' });
    } catch (error) {
        return Responses._400({ message: 'Failed to send status messages' });
    }
};
