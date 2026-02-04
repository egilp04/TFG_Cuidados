import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Activities } from './activities';
import { TranslateModule } from '@ngx-translate/core';

describe('Activities', () => {
  let component: Activities;
  let fixture: ComponentFixture<Activities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Activities, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(Activities);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
