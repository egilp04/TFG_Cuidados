import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Buttonback } from '../../components/buttonback/buttonback';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-terms',
  imports: [CommonModule, Buttonback, TranslateModule],
  templateUrl: './terms.html',
  styleUrl: './terms.css',
})
export class Terms {
  currentDate = new Date();
  params = {
    appName: 'CuidaDos',
    email: 'admin@gmail.com',
  };
}
