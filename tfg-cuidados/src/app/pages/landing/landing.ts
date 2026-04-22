import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../components/button/button';
import { CardsLanding } from '../../components/cards-landing/cards-landing';
import cardsdata from '../../../assets/data/Cards.json';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ResponsiveSize } from '../../services/responsive-size';
import { Card } from '../../interfaces/card';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [ButtonComponent, CardsLanding, TranslateModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export default class Landing {
  public cardsdata: Card[] = cardsdata;
  private dialog = inject(MatDialog);
  private responsive = inject(ResponsiveSize);

  async openModal() {
    const { Loginmodal } = await import('../../components/loginmodal/loginmodal');
    this.dialog.open(Loginmodal, {
      data: { mode: 'register' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
      maxHeight: '80vh',
    });
  }
}
