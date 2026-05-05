import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CreateBoardDialogComponent } from './create-board-dialog.component';

describe('CreateBoardDialogComponent', () => {
  let fixture: ComponentFixture<CreateBoardDialogComponent>;
  let component: CreateBoardDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CreateBoardDialogComponent>>;

  async function setup(data: any) {
    dialogRef = jasmine.createSpyObj<MatDialogRef<CreateBoardDialogComponent>>('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [CreateBoardDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBoardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('initializes create mode and closes with trimmed payload', async () => {
    await setup({ workspaceId: 5 });
    expect(component.dialogMode).toBe('create');
    component.form.patchValue({ name: ' Sprint ', description: ' Main board ', visibility: 'PUBLIC', background: '#C62828' });
    component.submit();
    expect(dialogRef.close).toHaveBeenCalledWith({
      workspaceId: 5,
      name: 'Sprint',
      description: 'Main board',
      visibility: 'PUBLIC',
      background: '#C62828'
    });
  });

  it('loads edit data and blocks invalid submit', async () => {
    await setup({ workspaceId: 5, mode: 'edit', board: { name: 'Roadmap', description: 'Desc', visibility: 'PRIVATE', background: '#455A64' } });
    expect(component.dialogMode).toBe('edit');
    expect(component.form.getRawValue().name).toBe('Roadmap');
    component.form.patchValue({ name: '' });
    component.submit();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
