import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  cors: { origin: '*' }, // ⚠️ cámbialo por tu dominio en prod
})
export class NotificationsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  // 🔐 Registro de notificaciones emitidas para evitar duplicados visuales
  private recentEmits = new Map<string, number>();

  afterInit() {
    console.log('🌐 Gateway de notificaciones inicializado');
  }

  sendNewNotification(notification: Notification) {
    // 🧠 Crear una clave única según categoría, título y reserva
    const key = `${notification.category}-${notification.title}-${notification['restaurantReservation']?.id ?? ''}`;

    const now = Date.now();
    const last = this.recentEmits.get(key);

    // Ignorar si ya se emitió hace menos de 5 segundos
    if (last && now - last < 5000) {
      console.warn('🚫 Notificación duplicada ignorada en Gateway:', key);
      return;
    }

    this.recentEmits.set(key, now);

    // Emitir al panel
    this.server.emit('notification:new', notification);
    console.log(`🔔 Emitida notificación push: ${notification.title}`);
  }
}
