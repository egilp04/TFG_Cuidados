import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modifyprofileform } from './modifyprofileform';
import { TranslateModule } from '@ngx-translate/core';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

describe('Modifyprofileform', () => {
  let component: Modifyprofileform;
  let fixture: ComponentFixture<Modifyprofileform>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modifyprofileform, TranslateModule.forRoot(), LucideAngularModule.pick({ ChevronDown })],
    }).compileComponents();

    fixture = TestBed.createComponent(Modifyprofileform);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
