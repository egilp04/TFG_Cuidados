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
  constructor(private el: ElementRef) { }

  ngOnInit() {

    const elementoHTML = this.el.nativeElement;
    document.body.appendChild(elementoHTML);

    elementoHTML.style.top = '0';
    elementoHTML.style.left = '0';
    elementoHTML.style.width = '100%';
    elementoHTML.style.zIndex = '999999';
    elementoHTML.style.pointerEvents = 'none';
  }
  ngOnDestroy() {
    this.el.nativeElement.remove();
  }
}