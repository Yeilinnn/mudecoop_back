import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  cors: { origin: '*' }, // ⚠️ cambia '*' por tu dominio en producción
})
export class NotificationsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('🌐 Gateway de notificaciones inicializado');
  }

  sendNewNotification(notification: Notification) {
    this.server.emit('notification:new', notification);
    console.log(`🔔 Emitida notificación push: ${notification.title}`);
  }
}
