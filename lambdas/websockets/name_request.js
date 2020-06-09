const Responses = require('../common/API_Responses');
const WebSocket = require('../common/WebSocket');

exports.handler = async event => {
    const { connectionId, domainName, stage } = event.requestContext;

    await WebSocket.send({
        domainName,
        stage,
        connectionId,
        message: JSON.stringify({ type: "request", content: connectionId })
    });
    return Responses._200({ message: 'Request fulfilled' });
};
