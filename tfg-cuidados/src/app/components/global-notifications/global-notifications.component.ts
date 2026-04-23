import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from '../../services/message-service';
import { Component, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';

@Component({
  selector: 'app-global-notifications',
  imports: [CommonModule, TranslateModule],
  templateUrl: './global-notifications.component.html',
  styleUrl: './global-notifications.component.css',
})
export class GlobalNotificationsComponent implements OnInit, OnDestroy {
  public messageService = inject(MessageService);
  constructor(private el: ElementRef) {}
  ngOnInit() {
    document.body.appendChild(this.el.nativeElement);

    this.el.style.position = 'fixed';
    this.el.style.top = '0';
    this.el.style.left = '0';
    this.el.style.width = '100%';
    this.el.style.zIndex = '999999';
    this.el.style.pointerEvents = 'none';
  }
  ngOnDestroy() {
    this.el.nativeElement.remove();
}
}