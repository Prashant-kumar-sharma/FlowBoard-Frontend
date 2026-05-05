import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  it('closes with true on confirm and false on cancel', () => {
    const dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const component = new ConfirmDialogComponent(dialogRef, {
      title: 'Confirm',
      message: 'Proceed?'
    });

    component.onConfirm();
    component.onCancel();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
