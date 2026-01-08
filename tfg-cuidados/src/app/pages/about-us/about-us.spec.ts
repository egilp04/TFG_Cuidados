import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUs } from './about-us';
import { TranslateModule } from '@ngx-translate/core';

describe('AboutUs', () => {
  let component: AboutUs;
  let fixture: ComponentFixture<AboutUs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUs, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutUs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
