import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  const authBase = 'http://localhost:8080/api/v1/admin';
  const workspaceBase = 'http://localhost:8080/api/v1/workspaces/admin';
  const boardBase = 'http://localhost:8080/api/v1/boards/admin';
  const cardBase = 'http://localhost:8080/api/v1/cards';
  const notificationBase = 'http://localhost:8080/api/v1/notifications';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AdminService]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('covers the admin endpoints', () => {
    service.getStats().subscribe();
    httpMock.expectOne(`${authBase}/stats`).flush({});

    service.getUsers().subscribe();
    httpMock.expectOne(`${authBase}/users`).flush([]);

    service.changeRole(5, 'PLATFORM_ADMIN').subscribe();
    const changeRole = httpMock.expectOne(`${authBase}/users/5/role`);
    expect(changeRole.request.method).toBe('PATCH');
    expect(changeRole.request.body).toEqual({ role: 'PLATFORM_ADMIN' });
    changeRole.flush({});

    service.suspendUser(5).subscribe();
    httpMock.expectOne(`${authBase}/users/5/suspend`).flush({});

    service.restoreUser(5).subscribe();
    httpMock.expectOne(`${authBase}/users/5/restore`).flush({});

    service.deleteUser(5).subscribe();
    const deleteUser = httpMock.expectOne(`${authBase}/users/5`);
    expect(deleteUser.request.method).toBe('DELETE');
    deleteUser.flush({});

    service.getAllWorkspaces().subscribe();
    httpMock.expectOne(`${workspaceBase}/all`).flush([]);

    service.deleteWorkspace(3).subscribe();
    const deleteWorkspace = httpMock.expectOne(`${workspaceBase}/3`);
    expect(deleteWorkspace.request.method).toBe('DELETE');
    deleteWorkspace.flush({});

    service.getWorkspaceAudit().subscribe();
    httpMock.expectOne(`${workspaceBase}/audit`).flush([]);

    service.getAllBoards().subscribe();
    httpMock.expectOne(`${boardBase}/all`).flush([]);

    service.closeBoard(7).subscribe();
    const closeBoard = httpMock.expectOne(`${boardBase}/7/close`);
    expect(closeBoard.request.method).toBe('PATCH');
    closeBoard.flush({});

    service.deleteBoard(7).subscribe();
    const deleteBoard = httpMock.expectOne(`${boardBase}/7`);
    expect(deleteBoard.request.method).toBe('DELETE');
    deleteBoard.flush({});

    service.getBoardAudit().subscribe();
    httpMock.expectOne(`${boardBase}/audit`).flush([]);

    service.getAllCards().subscribe();
    httpMock.expectOne(`${cardBase}/admin/all`).flush([]);

    service.getOverdueCards().subscribe();
    httpMock.expectOne(`${cardBase}/overdue`).flush([]);

    service.getCardAudit().subscribe();
    httpMock.expectOne(`${cardBase}/admin/activity`).flush([]);

    service.broadcast({ recipientIds: [1], title: 'Hello', message: 'World' }).subscribe();
    const broadcast = httpMock.expectOne(`${notificationBase}/broadcast`);
    expect(broadcast.request.method).toBe('POST');
    expect(broadcast.request.body).toEqual({ recipientIds: [1], title: 'Hello', message: 'World' });
    broadcast.flush({});
  });
});
