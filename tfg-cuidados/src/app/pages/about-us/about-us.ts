import { Component } from '@angular/core';
import { Card } from '../../interfaces/card';
import cardsdata from '../../../assets/data/Creators.json';
import { CardsLanding } from '../../components/cards-landing/cards-landing';
import { Buttonback } from '../../components/buttonback/buttonback';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CardsLanding, Buttonback, TranslateModule],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {
  public cardsdata: Card[] = cardsdata;
}
