import { Component, inject } from '@angular/core';
import { CardsLanding } from '../../components/cards-landing/cards-landing';
import cardsdata from '../../../assets/data/Manuals.json';
import { Card } from '../../interfaces/card';
import { ButtonComponent } from '../../components/button/button';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ChatSoporteComponent } from '../../components/chat-soporte/chat-soporte.component';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-manuals',
  standalone: true,
  imports: [CardsLanding, ButtonComponent, Buttonback, ChatSoporteComponent, TranslateModule],
  templateUrl: './manuals.html',
  styleUrl: './manuals.css',
})
export class Manuals {
  public cardsdata: Card[] = cardsdata;
  public authService = inject(AuthService);
  rol = this.authService.userRol();
}
