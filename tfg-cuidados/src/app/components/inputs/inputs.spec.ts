import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inputs } from './inputs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

describe('Inputs', () => {
  let component: Inputs;
  let fixture: ComponentFixture<Inputs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inputs, ReactiveFormsModule, LucideAngularModule.pick({ Eye, EyeOff })],
    }).compileComponents();

    fixture = TestBed.createComponent(Inputs);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('label', 'Password');
    fixture.componentRef.setInput('name', 'password');
    fixture.componentRef.setInput('type', 'password');
    fixture.componentRef.setInput('control', new FormControl(''));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.inputType()).toBe('password');
    // CAMBIO AQUÍ: .toBe(false)
    expect(component.isPasswordVisible()).toBe(false);

    component.togglePasswordVisibility();

    expect(component.inputType()).toBe('text');
    // CAMBIO AQUÍ: .toBe(true)
    expect(component.isPasswordVisible()).toBe(true);

    component.togglePasswordVisibility();

    expect(component.inputType()).toBe('password');
  });
});
