import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Buttonback } from '../../components/buttonback/buttonback';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-privacity',
  imports: [CommonModule, Buttonback, TranslateModule],
  templateUrl: './privacity.component.html',
  styleUrl: './privacity.component.css',
})
export default class PrivacityComponent {
  currentDate = new Date();
  params = {
    appName: 'CuidaDos',
    email: 'cuidados1312@gmail.com',
  };
}
