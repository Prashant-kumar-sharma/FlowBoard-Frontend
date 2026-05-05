import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CreateCardDialogComponent } from './create-card-dialog.component';
import { BoardService } from '../../core/services/board.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { AuthService } from '../../core/auth/auth.service';

describe('CreateCardDialogComponent', () => {
  let fixture: ComponentFixture<CreateCardDialogComponent>;
  let component: CreateCardDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CreateCardDialogComponent>>;
  let boardService: jasmine.SpyObj<BoardService>;
  let workspaceService: jasmine.SpyObj<WorkspaceService>;
  let authService: jasmine.SpyObj<AuthService>;

  async function setup(data: any, board: any = { workspaceId: 9 }) {
    dialogRef = jasmine.createSpyObj<MatDialogRef<CreateCardDialogComponent>>('MatDialogRef', ['close']);
    boardService = jasmine.createSpyObj<BoardService>('BoardService', ['getMembers', 'getById']);
    workspaceService = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['getMembers']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getUserById']);

    boardService.getMembers.and.returnValue(of([{ id: 1, userId: 10, boardId: 2, role: 'MEMBER', addedAt: '2026-05-04' }]));
    boardService.getById.and.returnValue(of(board));
    workspaceService.getMembers.and.returnValue(of([{ id: 2, userId: 11, workspaceId: 9, role: 'ADMIN', joinedAt: '2026-05-04' }]));
    authService.getUserById.and.callFake((id: number) => of({
      id,
      fullName: `User ${id}`,
      email: `u${id}@mail.com`,
      username: `user${id}`,
      role: 'MEMBER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: '2026-05-04'
    } as any));

    await TestBed.configureTestingModule({
      imports: [CreateCardDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: BoardService, useValue: boardService },
        { provide: WorkspaceService, useValue: workspaceService },
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads assignable members when workspace id is provided', async () => {
    await setup({ listId: 1, boardId: 2, workspaceId: 9 });
    expect(boardService.getMembers).toHaveBeenCalledWith(2);
    expect(workspaceService.getMembers).toHaveBeenCalledWith(9);
    expect(component.assignableMembers.length).toBe(1);
    expect(component.getAssignableMemberLabel(11)).toBe('user11');
    expect(component.loadingAssignees).toBeFalse();
  });

  it('loads board and workspace members when workspace id is absent', async () => {
    await setup({ listId: 1, boardId: 2 });
    expect(boardService.getById).toHaveBeenCalledWith(2);
    expect(workspaceService.getMembers).toHaveBeenCalledWith(9);
    expect(component.assignableMembers.length).toBe(1);
  });

  it('formats helpers and falls back for missing users', async () => {
    await setup({ listId: 1, boardId: 2 });
    expect(component.showTitleError()).toBeFalse();
    component.form.get('title')?.setValue('');
    component.form.get('title')?.markAsTouched();
    expect(component.showTitleError()).toBeTrue();
    expect(component.formatPriority('CRITICAL')).toBe('Critical');
    expect(component.priorityClass('HIGH')).toBe('high');
    expect(component.getAssignableMemberLabel(999)).toBe('User #999');
    expect(component.trackByAssignableMember(0, { userId: 44 })).toBe(44);
  });

  it('prefers username, then full name, then a user id fallback for labels', async () => {
    await setup({ listId: 1, boardId: 2 });

    component.assignableUsers[50] = {
      id: 50,
      username: '',
      fullName: 'Fallback Name',
      email: 'fallback@example.com',
      role: 'MEMBER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: '2026-05-04'
    } as any;

    expect(component.getAssignableMemberLabel(11)).toBe('user11');
    expect(component.getAssignableMemberLabel(50)).toBe('Fallback Name');
    expect(component.getAssignableMemberLabel(999)).toBe('User #999');
  });

  it('closes with parsed card payload and supports cancel', async () => {
    await setup({ listId: 1, boardId: 2 });
    component.form.patchValue({
      title: '  Ship feature  ',
      description: '  Finish tests  ',
      priority: 'HIGH',
      dueDate: '2026-05-10',
      assigneeId: '11'
    });

    component.onSave();
    expect(dialogRef.close).toHaveBeenCalledWith({
      title: 'Ship feature',
      description: 'Finish tests',
      priority: 'HIGH',
      dueDate: '2026-05-10',
      assigneeId: 11,
      listId: 1,
      boardId: 2
    });

    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('omits optional payload fields when they are blank or invalid', async () => {
    await setup({ listId: 1, boardId: 2 });
    component.form.patchValue({
      title: ' Title only ',
      description: '   ',
      priority: 'LOW',
      dueDate: '',
      assigneeId: 'abc'
    });

    component.onSave();

    expect(dialogRef.close).toHaveBeenCalledWith({
      title: 'Title only',
      description: undefined,
      priority: 'LOW',
      dueDate: undefined,
      assigneeId: undefined,
      listId: 1,
      boardId: 2
    });
  });

  it('marks form touched and blocks invalid save', async () => {
    await setup({ listId: 1, boardId: 2 });
    component.form.patchValue({ title: '' });
    component.onSave();
    expect(component.form.touched).toBeTrue();
  });

  it('falls back to board members when the board lookup fails', async () => {
    await setup({ listId: 1, boardId: 2 });
    component.workspaceMembers = [];
    component.boardMembers = [];
    component.assignableUsers = {};
    authService.getUserById.calls.reset();
    boardService.getById.and.returnValue(throwError(() => new Error('boom')));
    boardService.getMembers.and.returnValue(of([{ id: 3, userId: 22, boardId: 2, role: 'MEMBER', addedAt: '2026-05-04' }]));
    authService.getUserById.and.callFake((id: number) => of({
      id,
      fullName: `User ${id}`,
      email: `u${id}@mail.com`,
      username: `user${id}`,
      role: 'MEMBER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: '2026-05-04'
    } as any));

    (component as any).loadAssignableMembers();

    expect(component.workspaceMembers).toEqual([]);
    expect(component.boardMembers.length).toBe(1);
    expect(component.assignableMembers[0].userId).toBe(22);
    expect(component.loadingAssignees).toBeFalse();
  });

  it('handles workspace member lookup failures and cached assignable users', async () => {
    await setup({ listId: 1, boardId: 2, workspaceId: 9 });
    component.assignableUsers[10] = {
      id: 10,
      username: 'cached-user',
      fullName: 'Cached User',
      email: 'cached@example.com',
      role: 'MEMBER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: '2026-05-04'
    } as any;
    authService.getUserById.calls.reset();

    boardService.getMembers.and.returnValue(of([{ id: 1, userId: 10, boardId: 2, role: 'MEMBER', addedAt: '2026-05-04' }]));
    workspaceService.getMembers.and.returnValue(throwError(() => new Error('boom')));

    (component as any).loadAssignableMembers();

    expect(authService.getUserById).not.toHaveBeenCalledWith(10);
    expect(component.workspaceMembers).toEqual([]);
    expect(component.loadingAssignees).toBeFalse();
  });

  it('ignores user profile lookup failures when loading assignable users', async () => {
    await setup({ listId: 1, boardId: 2 });
    component.assignableUsers = {};
    authService.getUserById.and.callFake((id: number) =>
      id === 11
        ? throwError(() => new Error('boom'))
        : of({
            id,
            fullName: `User ${id}`,
            email: `u${id}@mail.com`,
            username: `user${id}`,
            role: 'MEMBER',
            provider: 'LOCAL',
            isActive: true,
            createdAt: '2026-05-04'
          } as any)
    );

    (component as any).loadAssignableUsers([10, 11], undefined);

    expect(component.assignableUsers[10]?.username).toBe('user10');
    expect(component.assignableUsers[11]).toBeUndefined();
  });

  it('defaults priority formatting helpers when the value is missing', async () => {
    await setup({ listId: 1, boardId: 2, mode: 'edit', card: { title: 'Edit me', priority: 'HIGH', assigneeId: 11 } });

    expect(component.dialogMode).toBe('edit');
    expect(component.formatPriority(undefined)).toBe('Medium');
    expect(component.priorityClass(undefined)).toBe('medium');
  });
});
