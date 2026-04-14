import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from '../../services/message-service';

@Component({
  selector: 'app-global-notifications',
  imports: [CommonModule, TranslateModule],
  templateUrl: './global-notifications.component.html',
  styleUrl: './global-notifications.component.css',
})
export class GlobalNotificationsComponent {
  public messageService = inject(MessageService);
}
