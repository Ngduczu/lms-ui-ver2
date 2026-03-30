import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WEBSOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';

export class StompConnection {
  constructor(roomId, token, onMessageReceived) {
    this.roomId = roomId;
    this.token = token;
    this.onMessageReceived = onMessageReceived;
    this.client = null;
    this.connected = false;
  }

  connect() {
    this.client = new Client({
      // We use SockJS as fallback or direct depending on STOMP config
      webSocketFactory: () => new SockJS(`${WEBSOCKET_URL}/ws-chat`),
      connectHeaders: {
        Authorization: `Bearer ${this.token}`,
      },
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      this.connected = true;
      // Subscribe to the dynamic room topic
      this.client.subscribe(`/chat-real-time/${this.roomId}`, (message) => {
        if (message.body) {
          const parsedMessage = JSON.parse(message.body);
          this.onMessageReceived(parsedMessage);
        }
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.activate();
  }

  sendMessage(content) {
    if (this.client && this.connected && content.trim()) {
      this.client.publish({
        destination: '/chat-app/chat.sendMessage',
        body: JSON.stringify({
          roomId: this.roomId,
          content: content.trim(),
        }),
      });
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
    this.connected = false;
  }
}
