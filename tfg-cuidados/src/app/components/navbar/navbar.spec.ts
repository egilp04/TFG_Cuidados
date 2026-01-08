import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Navbar } from './navbar';
import { TranslateModule } from '@ngx-translate/core';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
