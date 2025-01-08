import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const getMessages = async (channelId: string) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    KeyConditionExpression: 'channelId = :channelId',
    ExpressionAttributeValues: {
      ':channelId': channelId,
    },
  };

  try {
    const result = await dynamodb.query(params).promise();
    return result.Items;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const addMessage = async (message: any) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Item: message,
  };

  try {
    await dynamodb.put(params).promise();
    return message;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

export const getChannels = async () => {
  const params = {
    TableName: process.env.DYNAMODB_CHANNELS_TABLE_NAME,
  };

  try {
    const result = await dynamodb.scan(params).promise();
    return result.Items;
  } catch (error) {
    console.error('Error fetching channels:', error);
    throw error;
  }
};

export const addChannel = async (channel: any) => {
  const params = {
    TableName: process.env.DYNAMODB_CHANNELS_TABLE_NAME,
    Item: channel,
  };

  try {
    await dynamodb.put(params).promise();
    return channel;
  } catch (error) {
    console.error('Error adding channel:', error);
    throw error;
  }
};

