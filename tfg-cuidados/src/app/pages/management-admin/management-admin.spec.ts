import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementAdmin } from './management-admin';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('ManagementAdmin', () => {
  let component: ManagementAdmin;
  let fixture: ComponentFixture<ManagementAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementAdmin, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
