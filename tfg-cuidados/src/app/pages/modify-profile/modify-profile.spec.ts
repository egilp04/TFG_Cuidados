import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyProfilePage } from './modify-profile';
import { TranslateModule } from '@ngx-translate/core';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

describe('ModifyProfilePage', () => {
  let component: ModifyProfilePage;
  let fixture: ComponentFixture<ModifyProfilePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifyProfilePage, TranslateModule.forRoot(), LucideAngularModule.pick({ ChevronDown })],
    }).compileComponents();

    fixture = TestBed.createComponent(ModifyProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
