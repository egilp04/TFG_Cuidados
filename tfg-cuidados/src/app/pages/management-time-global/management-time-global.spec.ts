import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementTimeGlobal } from './management-time-global';
import { TranslateModule } from '@ngx-translate/core';

describe('ManagementTimeGlobal', () => {
  let component: ManagementTimeGlobal;
  let fixture: ComponentFixture<ManagementTimeGlobal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementTimeGlobal, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementTimeGlobal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
