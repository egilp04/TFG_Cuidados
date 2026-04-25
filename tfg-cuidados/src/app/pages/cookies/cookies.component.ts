import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Buttonback } from '../../components/buttonback/buttonback';

@Component({
  selector: 'app-cookies',
  imports: [CommonModule, Buttonback, TranslateModule],
  templateUrl: './cookies.component.html',
  styleUrl: './cookies.component.css',
})
export default class CookiesComponent {
  currentDate = new Date();
}
