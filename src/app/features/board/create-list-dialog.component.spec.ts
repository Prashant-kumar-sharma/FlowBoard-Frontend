import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CreateListDialogComponent } from './create-list-dialog.component';

describe('CreateListDialogComponent', () => {
  let fixture: ComponentFixture<CreateListDialogComponent>;
  let component: CreateListDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CreateListDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj<MatDialogRef<CreateListDialogComponent>>('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [CreateListDialogComponent, NoopAnimationsModule],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('blocks invalid submit', () => {
    component.submit();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('closes with trimmed list name', () => {
    component.form.patchValue({ name: '  Doing  ' });
    component.submit();
    expect(dialogRef.close).toHaveBeenCalledWith({ name: 'Doing' });
  });
});
