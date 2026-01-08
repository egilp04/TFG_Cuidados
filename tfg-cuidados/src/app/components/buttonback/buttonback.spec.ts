import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Buttonback } from './buttonback';
import { TranslateModule } from '@ngx-translate/core';

describe('Buttonback', () => {
  let component: Buttonback;
  let fixture: ComponentFixture<Buttonback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buttonback, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(Buttonback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
