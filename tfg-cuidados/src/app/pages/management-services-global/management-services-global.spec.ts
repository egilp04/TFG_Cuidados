import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementServicesGlobal } from './management-services-global';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Search } from 'lucide-angular';

describe('ManagementServicesGlobal', () => {
  let component: ManagementServicesGlobal;
  let fixture: ComponentFixture<ManagementServicesGlobal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ManagementServicesGlobal,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ Search }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementServicesGlobal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
