import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Messages } from './messages';
import { TranslateModule } from '@ngx-translate/core';

describe('Messages', () => {
  let component: Messages;
  let fixture: ComponentFixture<Messages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Messages, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(Messages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
