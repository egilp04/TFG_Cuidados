import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dropdown } from './dropdown';
import { TranslateModule } from '@ngx-translate/core';

describe('Dropdown', () => {
  let component: Dropdown;
  let fixture: ComponentFixture<Dropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dropdown, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(Dropdown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
