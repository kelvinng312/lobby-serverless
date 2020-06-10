const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WebSocket = require('../common/WebSocket');

const tableName = process.env.tableName;

exports.handler = async event => {
    const { connectionId } = event.requestContext;

    const body = JSON.parse(event.body);

    try {
        const record = await Dynamo.get(connectionId, tableName);
        const { messages, domainName, stage } = record;

        messages.push(body.message);

        const senderData = {
            ...record,
            messages,
        };

        await Dynamo.write(senderData, tableName);

        const data = await Dynamo.scan(tableName);
        for (const item of data.Items) {
            await WebSocket.send({
                domainName,
                stage,
                connectionId: item.ID,
                message: JSON.stringify({ sender: connectionId, content: body.message})
            });
        }
        return Responses._200({ message: 'Message received' });
    } catch (error) {
        return Responses._400({ message: 'Message not received' });
    }
};
