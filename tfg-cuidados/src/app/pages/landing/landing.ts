import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../components/button/button';
import { CardsLanding } from '../../components/cards-landing/cards-landing';
import cardsdata from '../../../assets/data/Cards.json';
import { MatDialog } from '@angular/material/dialog';
import { Card } from '../../interfaces/card';
import { Loginmodal } from '../../components/loginmodal/loginmodal';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [ButtonComponent, CardsLanding, TranslateModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  public cardsdata: Card[] = cardsdata;
  private dialog = inject(MatDialog);
  abrirModal() {
    this.dialog.open(Loginmodal, { data: { modo: 'registro' }, width: '500px' });
  }
}
