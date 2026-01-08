import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoverPasswordPage } from './recover-password';
import { TranslateModule } from '@ngx-translate/core';
import { Eye, EyeOff, LucideAngularModule } from 'lucide-angular';

describe('RecoverPasswordPage', () => {
  let component: RecoverPasswordPage;
  let fixture: ComponentFixture<RecoverPasswordPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RecoverPasswordPage,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ Eye, EyeOff }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecoverPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
