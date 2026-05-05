import { PromptDialogComponent } from './prompt-dialog.component';

describe('PromptDialogComponent', () => {
  it('initializes with the provided value and trims confirmed input', () => {
    const dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const component = new PromptDialogComponent(dialogRef, {
      title: 'Rename',
      message: 'Enter a value',
      value: ' Initial '
    });

    expect(component.value).toBe(' Initial ');

    component.value = '  Updated  ';
    component.onConfirm();

    expect(dialogRef.close).toHaveBeenCalledWith('Updated');
  });

  it('does not confirm blank values and cancels with null', () => {
    const dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const component = new PromptDialogComponent(dialogRef, {
      title: 'Rename',
      message: 'Enter a value'
    });

    component.value = '   ';
    component.onConfirm();
    expect(dialogRef.close).not.toHaveBeenCalled();

    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
