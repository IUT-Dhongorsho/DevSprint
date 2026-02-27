import amqp from "amqplib";
import type { Channel, ConsumeMessage } from "amqplib";
type MessageHandler = (data: any) => Promise<void>;

class RabbitMQ {
    private connection: amqp.ChannelModel | null = null;
    private channel: Channel | null = null;
    private readonly url: string;
    private readonly exchange: string;

    constructor(url: string, exchange: string) {
        this.url = url;
        this.exchange = exchange;
    }

    async connect(): Promise<void> {
        if (this.connection && this.channel) return;

        this.connection = await amqp.connect(this.url);

        this.connection.on("close", () => {
            console.error("RabbitMQ connection closed. Reconnecting...");
            this.connection = null;
            this.channel = null;
            setTimeout(() => this.connect(), 5000);
        });

        this.connection.on("error", (err) => {
            console.error("RabbitMQ connection error:", err);
        });

        this.channel = await this.connection.createChannel();

        await this.channel.assertExchange(this.exchange, "topic", {
            durable: true,
        });

        console.log("RabbitMQ connected");
    }

    async publish(routingKey: string, message: any): Promise<void> {
        if (!this.channel) throw new Error("RabbitMQ not initialized");

        const payload = Buffer.from(JSON.stringify(message));

        this.channel.publish(this.exchange, routingKey, payload, {
            persistent: true,
        });
    }

    async subscribe(
        queueName: string,
        routingKey: string,
        handler: MessageHandler
    ): Promise<void> {
        if (!this.channel) throw new Error("RabbitMQ not initialized");

        await this.channel.assertQueue(queueName, {
            durable: true,
        });

        await this.channel.bindQueue(queueName, this.exchange, routingKey);

        this.channel.consume(queueName, async (msg: ConsumeMessage | null) => {
            if (!msg) return;

            try {
                const content = JSON.parse(msg.content.toString());
                await handler(content);
                this.channel!.ack(msg);
            } catch (err) {
                console.error("Message processing failed:", err);
                this.channel!.nack(msg, false, false); // dead-letter instead of retry loop
            }
        });
    }

    async close(): Promise<void> {
        await this.channel?.close();
        await this.connection?.close();
    }
}

export default RabbitMQ;