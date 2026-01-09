import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contracts } from './contracts';
import { TranslateModule } from '@ngx-translate/core';

describe('Contracts', () => {
  let component: Contracts;
  let fixture: ComponentFixture<Contracts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contracts, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(Contracts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
