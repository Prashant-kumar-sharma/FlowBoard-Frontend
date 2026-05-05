import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkspaceService } from './workspace.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let httpMock: HttpTestingController;

  const baseUrl = 'http://localhost:8080/api/v1/workspaces';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkspaceService
      ]
    });

    service = TestBed.inject(WorkspaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a workspace', () => {
    const payload = { name: 'Product', description: 'Workspace for product ops' };

    service.create(payload).subscribe();

    const request = httpMock.expectOne(baseUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('gets a workspace by id', () => {
    service.getById(11).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/11`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('gets my workspaces', () => {
    service.getMy().subscribe();

    const request = httpMock.expectOne(`${baseUrl}/my`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('gets public workspaces', () => {
    service.getPublic().subscribe();

    const request = httpMock.expectOne(`${baseUrl}/public`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('updates a workspace', () => {
    service.update(11, { name: 'Updated workspace' }).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/11`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ name: 'Updated workspace' });
    request.flush({});
  });

  it('deletes a workspace', () => {
    service.delete(11).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/11`);
    expect(request.request.method).toBe('DELETE');
    request.flush({});
  });

  it('adds a member using the default role', () => {
    service.addMember(11, 6).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/11/members`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ userId: 6, role: 'MEMBER' });
    request.flush({});
  });

  it('adds a member using a provided role', () => {
    service.addMember(11, 6, 'ADMIN').subscribe();

    const request = httpMock.expectOne(`${baseUrl}/11/members`);
    expect(request.request.body).toEqual({ userId: 6, role: 'ADMIN' });
    request.flush({});
  });

  it('removes a member', () => {
    service.removeMember(11, 6).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/11/members/6`);
    expect(request.request.method).toBe('DELETE');
    request.flush({});
  });

  it('updates a member role', () => {
    service.updateMemberRole(11, 6, 'ADMIN').subscribe();

    const request = httpMock.expectOne(`${baseUrl}/11/members/6/role`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ role: 'ADMIN' });
    request.flush({});
  });

  it('gets workspace members', () => {
    service.getMembers(11).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/11/members`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
