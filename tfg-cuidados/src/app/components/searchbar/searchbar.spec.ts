import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Searchbar } from './searchbar';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { LucideAngularModule, Search } from 'lucide-angular';

declare var spyOn: any;

describe('Searchbar', () => {
  let component: Searchbar;
  let fixture: ComponentFixture<Searchbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Searchbar,
        TranslateModule.forRoot(),
        ReactiveFormsModule,
        FormsModule,
        LucideAngularModule.pick({ Search }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Searchbar);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('control', new FormControl(''));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit value on input', () => {
    spyOn(component.searchEvent, 'emit');
    const inputElement = fixture.nativeElement.querySelector('input');
    inputElement.value = 'test';
    inputElement.dispatchEvent(new Event('input'));
    expect(component.searchEvent.emit).toHaveBeenCalledWith('test');
  });
});
