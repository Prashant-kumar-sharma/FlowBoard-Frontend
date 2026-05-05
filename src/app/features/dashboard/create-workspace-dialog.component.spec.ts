import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CreateWorkspaceDialogComponent } from './create-workspace-dialog.component';

describe('CreateWorkspaceDialogComponent', () => {
  let fixture: ComponentFixture<CreateWorkspaceDialogComponent>;
  let component: CreateWorkspaceDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CreateWorkspaceDialogComponent>>;

  async function setup(data: any = null) {
    dialogRef = jasmine.createSpyObj<MatDialogRef<CreateWorkspaceDialogComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [CreateWorkspaceDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateWorkspaceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('defaults to create mode and closes trimmed payload', async () => {
    await setup();
    expect(component.dialogMode).toBe('create');
    component.form.patchValue({ name: ' Product ', description: ' Desc ', visibility: 'PUBLIC' });
    component.submit();
    expect(dialogRef.close).toHaveBeenCalledWith({
      name: 'Product',
      description: 'Desc',
      visibility: 'PUBLIC'
    });
  });

  it('patches edit mode values and blocks invalid submit', async () => {
    await setup({ mode: 'edit', workspace: { name: 'Flow', description: 'Team', visibility: 'PUBLIC' } });
    expect(component.dialogMode).toBe('edit');
    expect(component.form.getRawValue().name).toBe('Flow');
    component.form.patchValue({ name: '' });
    component.submit();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('omits the optional description when it is blank after trimming', async () => {
    await setup();
    component.form.patchValue({ name: 'Workspace', description: '   ', visibility: 'PRIVATE' });

    component.submit();

    expect(dialogRef.close).toHaveBeenCalledWith({
      name: 'Workspace',
      description: undefined,
      visibility: 'PRIVATE'
    });
  });
});
