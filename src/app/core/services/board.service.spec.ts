import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BoardService } from './board.service';

describe('BoardService', () => {
  let service: BoardService;
  let httpMock: HttpTestingController;

  const baseUrl = 'http://localhost:8080/api/v1/boards';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BoardService
      ]
    });

    service = TestBed.inject(BoardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a board', () => {
    const payload = { name: 'Roadmap', workspaceId: 7, visibility: 'PRIVATE' as const };

    service.create(payload).subscribe();

    const request = httpMock.expectOne(baseUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('gets a board by id', () => {
    service.getById(9).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('gets boards by workspace', () => {
    service.getByWorkspace(4).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/workspace/4`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('gets my boards', () => {
    service.getMy().subscribe();

    const request = httpMock.expectOne(`${baseUrl}/my`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('updates a board', () => {
    service.update(9, { name: 'Updated board' }).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ name: 'Updated board' });
    request.flush({});
  });

  it('closes a board', () => {
    service.close(9).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9/close`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    request.flush({});
  });

  it('deletes a board', () => {
    service.delete(9).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9`);
    expect(request.request.method).toBe('DELETE');
    request.flush({});
  });

  it('adds a member using the default role', () => {
    service.addMember(9, 5).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9/members`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ userId: 5, role: 'MEMBER' });
    request.flush({});
  });

  it('adds a member using a provided role', () => {
    service.addMember(9, 5, 'OWNER').subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9/members`);
    expect(request.request.body).toEqual({ userId: 5, role: 'OWNER' });
    request.flush({});
  });

  it('removes a member', () => {
    service.removeMember(9, 5).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9/members/5`);
    expect(request.request.method).toBe('DELETE');
    request.flush({});
  });

  it('updates a member role', () => {
    service.updateMemberRole(9, 5, 'ADMIN').subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9/members/5/role`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ role: 'ADMIN' });
    request.flush({});
  });

  it('gets board members', () => {
    service.getMembers(9).subscribe();

    const request = httpMock.expectOne(`${baseUrl}/9/members`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
