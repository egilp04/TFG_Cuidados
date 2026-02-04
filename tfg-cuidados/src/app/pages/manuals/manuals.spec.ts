import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Manuals } from './manuals';
import { TranslateModule } from '@ngx-translate/core';

describe('Manuals', () => {
  let component: Manuals;
  let fixture: ComponentFixture<Manuals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Manuals, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(Manuals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
