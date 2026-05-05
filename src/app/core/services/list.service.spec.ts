import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ListService } from './list.service';

describe('ListService', () => {
  let service: ListService;
  let httpMock: HttpTestingController;

  const base = 'http://localhost:8080/api/v1/lists';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ListService]
    });
    service = TestBed.inject(ListService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('covers list endpoints', () => {
    service.create({ name: 'Todo' }).subscribe();
    httpMock.expectOne(base).flush({});

    service.getById(1).subscribe();
    httpMock.expectOne(`${base}/1`).flush({});

    service.getByBoard(2).subscribe();
    httpMock.expectOne(`${base}/board/2`).flush([]);

    service.getArchived(2).subscribe();
    httpMock.expectOne(`${base}/board/2/archived`).flush([]);

    service.update(1, 'Done', '#fff').subscribe();
    const update = httpMock.expectOne(`${base}/1`);
    expect(update.request.body).toEqual({ name: 'Done', color: '#fff' });
    update.flush({});

    service.reorder(2, [1, 2]).subscribe();
    httpMock.expectOne(`${base}/board/2/reorder`).flush({});

    service.archive(1).subscribe();
    httpMock.expectOne(`${base}/1/archive`).flush({});

    service.unarchive(1).subscribe();
    httpMock.expectOne(`${base}/1/unarchive`).flush({});

    service.move(1, 4).subscribe();
    const move = httpMock.expectOne(`${base}/1/move`);
    expect(move.request.body).toEqual({ targetBoardId: 4 });
    move.flush({});

    service.delete(1).subscribe();
    const deleteReq = httpMock.expectOne(`${base}/1`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});
  });
});
