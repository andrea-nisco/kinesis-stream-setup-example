import { KinesisStreamEvent } from "aws-lambda";

// Placeholder types
type RawMessage = any; // Placeholder for the actual RawMessage type
type Message<T> = { payload: T }; // Generic message structure

// Example parsing function as a placeholder
const parseRecordToMessage = (record: any): Message<RawMessage> => {
  const data = JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString());
  return { payload: data }; // Simulating a parsed message
};

// Example processing function as a placeholder
const processMessage = async (message: Message<RawMessage>, recordId: string): Promise<void> => {
  console.log(`Processing message with ID ${recordId}:`, message);
};

export const handler = async (event: KinesisStreamEvent): Promise<number> => {
  const startTime = performance.now();
  try {
    const totalRecords = event.Records.length;

    let totalSize = 0;
    let maxSize = 0;
    let minSize = Number.MAX_SAFE_INTEGER;
    let failedMessages = 0;
    let totalMessages = 0;

    // Iterate through each record
    for (const record of event.Records) {
      const partitionKey = record.kinesis.partitionKey;
      console.log(`PartitionKey=${partitionKey}`);
      const recordSize = Buffer.byteLength(record.kinesis.data, 'base64') / 1024; // Calculate size in KB
      totalSize += recordSize;
      maxSize = Math.max(maxSize, recordSize);
      minSize = Math.min(minSize, recordSize);

      totalMessages += 1;
      const recordId = record.eventID;

      try {
        const message: Message<RawMessage> = parseRecordToMessage(record); // Parse message
        await processMessage(message, recordId); // Process message
      } catch (error) {
        console.error(`Error processing message with ID ${recordId}: ${error}`);
        failedMessages++;
      }
    }

    // Calculate metrics
    const errorRate = (failedMessages / totalMessages) * 100;
    const averageSize = totalSize / totalRecords;
    const totalTime = (performance.now() - startTime) / 1000;
    const messagesPerSecond = totalRecords / totalTime;

    // Log metrics
    const statusLog = {
      'Total records received': totalRecords,
      'Error rate': `${errorRate.toFixed(2)}%`,
      'Average record size': `${averageSize.toFixed(2)} KB`,
      'Largest record size': `${maxSize.toFixed(2)} KB`,
      'Smallest record size': `${minSize.toFixed(2)} KB`,
      'Total payload size': `${totalSize.toFixed(2)} KB`,
      'Handler execution time': `${totalTime.toFixed(2)} seconds`,
      'Messages per second': `${messagesPerSecond.toFixed(2)}`
    };

    console.log(`Result=${JSON.stringify(statusLog, null, 2)}`);
    return messagesPerSecond;
  } catch (error) {
    console.error(`Error processing records from Kinesis: ${error}`);
    return -1;
  }
};
