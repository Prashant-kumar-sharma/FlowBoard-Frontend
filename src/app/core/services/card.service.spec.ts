import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CardService } from './card.service';

describe('CardService', () => {
  let service: CardService;
  let httpMock: HttpTestingController;

  const cardBase = 'http://localhost:8080/api/v1/cards';
  const listBase = 'http://localhost:8080/api/v1/lists';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CardService]
    });
    service = TestBed.inject(CardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('covers card and list endpoints', () => {
    service.create({ title: 'Task', listId: 1, boardId: 2 } as any).subscribe();
    httpMock.expectOne(cardBase).flush({});

    service.getById(1).subscribe();
    httpMock.expectOne(`${cardBase}/1`).flush({});

    service.getByList(2).subscribe();
    httpMock.expectOne(`${cardBase}/list/2`).flush([]);

    service.getByBoard(3).subscribe();
    httpMock.expectOne(`${cardBase}/board/3`).flush([]);

    service.getByAssignee(6).subscribe();
    httpMock.expectOne(`${cardBase}/assignee/6`).flush([]);

    service.update(1, { title: 'Updated' }).subscribe();
    httpMock.expectOne(`${cardBase}/1`).flush({});

    service.move(1, 4, 0).subscribe();
    const move = httpMock.expectOne(`${cardBase}/1/move`);
    expect(move.request.body).toEqual({ targetListId: 4, position: 0 });
    move.flush({});

    service.reorder(2, [1, 2]).subscribe();
    httpMock.expectOne(`${cardBase}/list/2/reorder`).flush({});

    service.setAssignee(1, null).subscribe();
    httpMock.expectOne(`${cardBase}/1/assignee`).flush({});

    service.setPriority(1, 'HIGH').subscribe();
    httpMock.expectOne(`${cardBase}/1/priority`).flush({});

    service.setStatus(1, 'DONE' as any).subscribe();
    httpMock.expectOne(`${cardBase}/1/status`).flush({});

    service.archive(1).subscribe();
    httpMock.expectOne(`${cardBase}/1/archive`).flush({});

    service.delete(1).subscribe();
    const deleteReq = httpMock.expectOne(`${cardBase}/1`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});

    service.getOverdue().subscribe();
    httpMock.expectOne(`${cardBase}/overdue`).flush([]);

    service.getActivity(1).subscribe();
    httpMock.expectOne(`${cardBase}/1/activity`).flush([]);

    service.getLists(9).subscribe();
    httpMock.expectOne(`${listBase}/board/9`).flush([]);

    service.createList(9, 'Todo').subscribe();
    httpMock.expectOne(listBase).flush({});

    service.updateList(4, 'Doing', '#fff').subscribe();
    httpMock.expectOne(`${listBase}/4`).flush({});

    service.reorderLists(9, [4, 5]).subscribe();
    httpMock.expectOne(`${listBase}/board/9/reorder`).flush({});

    service.archiveList(4).subscribe();
    httpMock.expectOne(`${listBase}/4/archive`).flush({});

    service.deleteList(4).subscribe();
    const deleteList = httpMock.expectOne(`${listBase}/4`);
    expect(deleteList.request.method).toBe('DELETE');
    deleteList.flush({});
  });
});
