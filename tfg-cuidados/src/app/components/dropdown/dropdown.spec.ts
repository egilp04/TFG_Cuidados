import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dropdown } from './dropdown';
import { TranslateModule } from '@ngx-translate/core';

declare var spyOn: any;

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

  it('should toggle isOpen state', () => {
    expect(component.isOpen).toBe(false);
    component.toggleDropdown();
    expect(component.isOpen).toBe(true);
    component.toggleDropdown();
    expect(component.isOpen).toBe(false);
  });

  it('should select option and emit event', () => {
    spyOn(component.onSelect, 'emit');
    const option = 'Option 1';

    component.isOpen = true;
    component.selectOption(option);

    expect(component.selectedOption).toBe(option);
    expect(component.isOpen).toBe(false);
    expect(component.onSelect.emit).toHaveBeenCalledWith(option);
  });
});
