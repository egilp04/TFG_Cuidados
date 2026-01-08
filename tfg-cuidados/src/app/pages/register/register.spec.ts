import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Register } from './register';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { ChevronDown, Eye, EyeOff, LucideAngularModule } from 'lucide-angular';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register, TranslateModule.forRoot(), LucideAngularModule.pick({ ChevronDown, Eye, EyeOff})],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
