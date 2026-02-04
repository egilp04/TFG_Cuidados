import { Component } from '@angular/core';
import { CardsLanding } from '../../components/cards-landing/cards-landing';
import cardsdata from '../../../assets/data/Manuals.json';
import { Card } from '../../interfaces/card';
import { ButtonComponent } from '../../components/button/button';
import { Buttonback } from '../../components/buttonback/buttonback';

@Component({
  selector: 'app-manuals',
  standalone: true,
  imports: [CardsLanding, ButtonComponent, Buttonback],
  templateUrl: './manuals.html',
  styleUrl: './manuals.css',
})
export class Manuals {
  public cardsdata: Card[] = cardsdata;
}
