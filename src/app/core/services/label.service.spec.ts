import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LabelService } from './label.service';

describe('LabelService', () => {
  let service: LabelService;
  let httpMock: HttpTestingController;

  const base = 'http://localhost:8087/api/v1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), LabelService]
    });
    service = TestBed.inject(LabelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('covers labels and checklist endpoints', () => {
    service.getLabelsByBoard(1).subscribe();
    httpMock.expectOne(`${base}/boards/1/labels`).flush([]);

    service.createLabel(1, 'Bug', '#f00').subscribe();
    httpMock.expectOne(`${base}/boards/1/labels`).flush({});

    service.updateLabel(3, 'Feature', '#0f0').subscribe();
    const update = httpMock.expectOne(`${base}/labels/3`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ name: 'Feature', color: '#0f0' });
    update.flush({});

    service.deleteLabel(3).subscribe();
    const deleteLabel = httpMock.expectOne(`${base}/labels/3`);
    expect(deleteLabel.request.method).toBe('DELETE');
    deleteLabel.flush({});

    service.addToCard(2, 3).subscribe();
    httpMock.expectOne(`${base}/cards/2/labels/3`).flush({});

    service.removeFromCard(2, 3).subscribe();
    const remove = httpMock.expectOne(`${base}/cards/2/labels/3`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush({});

    service.getForCard(2).subscribe();
    httpMock.expectOne(`${base}/cards/2/labels`).flush([]);

    service.getChecklists(2).subscribe();
    httpMock.expectOne(`${base}/cards/2/checklists`).flush([]);

    service.createChecklist(2, 'Checklist').subscribe();
    httpMock.expectOne(`${base}/cards/2/checklists`).flush({});

    service.addItem(5, 'Item', 8).subscribe();
    const addItem = httpMock.expectOne(`${base}/checklists/5/items`);
    expect(addItem.request.body).toEqual({ text: 'Item', assigneeId: 8 });
    addItem.flush({});

    service.toggleItem(9).subscribe();
    httpMock.expectOne(`${base}/checklist-items/9/toggle`).flush({});

    service.getProgress(5).subscribe();
    httpMock.expectOne(`${base}/checklists/5/progress`).flush({ progress: 50 });
  });
});
