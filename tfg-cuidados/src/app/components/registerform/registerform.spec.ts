import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Registerform } from './registerform';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { ChevronDown, Eye, EyeOff, LucideAngularModule } from 'lucide-angular';

describe('Registerform', () => {
  let component: Registerform;
  let fixture: ComponentFixture<Registerform>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Registerform,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ Eye, EyeOff, ChevronDown }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Registerform);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
