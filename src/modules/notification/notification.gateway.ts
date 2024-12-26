import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { RedisCacheService } from '@/cache/redis-cache.service';

@WebSocketGateway({
  cors: true,
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  constructor(private readonly redisCacheService: RedisCacheService) {
    this.server?.setMaxListeners(20);
  }

  @SubscribeMessage('register')
  async registerSocket(socket: Socket, data: any) {
    socket.setMaxListeners(20);
    const { email } = data;
    if (email) {
      await this.redisCacheService.saveSocketConnection(email, socket.id);
    }
  }

  @SubscribeMessage('disconnect')
  async disconnectSocket(data: any) {
    const { email } = data;
    if (email) {
      await this.redisCacheService.removeSocketConnection(email);
    }
  }

  async handleConnection(socket: Socket) {
    socket.setMaxListeners(100);
    const email = socket.handshake.query.email as string;

    if (email) {
      await this.redisCacheService.saveSocketConnection(email, socket.id);
    }

    socket.removeAllListeners('disconnect');

    socket.on('disconnect', async () => {
      if (email) {
        await this.redisCacheService.removeSocketConnection(email);
      }
    });
  }

  async handleDisconnect(socket: Socket) {
    const email = socket.handshake.query.email as string;
    if (email) {
      await this.redisCacheService.removeSocketConnection(email);
    }
    socket.removeAllListeners();
  }

  async sendNotification(notification: any): Promise<void> {
    const socketId = await this.redisCacheService.getSocketIdByEmail(
      notification.receipient,
    );
    if (socketId) {
      this.server.to(socketId).emit('newNotification', notification);
    }
  }
}
