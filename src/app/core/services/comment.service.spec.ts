import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CommentService } from './comment.service';

describe('CommentService', () => {
  let service: CommentService;
  let httpMock: HttpTestingController;

  const base = 'http://localhost:8080/api/v1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CommentService]
    });
    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('covers comments and attachments', () => {
    service.getByCard(1).subscribe();
    httpMock.expectOne(`${base}/cards/1/comments`).flush([]);

    service.add(1, 'Hi', 5).subscribe();
    const add = httpMock.expectOne(`${base}/cards/1/comments`);
    expect(add.request.body).toEqual({ content: 'Hi', parentCommentId: 5 });
    add.flush({});

    service.getReplies(2).subscribe();
    httpMock.expectOne(`${base}/comments/2/replies`).flush([]);

    service.getCount(1).subscribe();
    httpMock.expectOne(`${base}/cards/1/comments/count`).flush(3);

    service.update(3, 'Updated').subscribe();
    httpMock.expectOne(`${base}/comments/3`).flush({});

    service.delete(3).subscribe();
    const deleteReq = httpMock.expectOne(`${base}/comments/3`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});

    service.getAttachments(4).subscribe();
    httpMock.expectOne(`${base}/cards/4/attachments`).flush([]);

    service.addAttachment(4, 'a.txt', 'url', 'text/plain', 12).subscribe();
    httpMock.expectOne(`${base}/cards/4/attachments`).flush({});

    const file = new File(['x'], 'demo.txt', { type: 'text/plain' });
    service.upload(4, file).subscribe();
    const upload = httpMock.expectOne(`${base}/cards/4/attachments/upload`);
    expect(upload.request.body instanceof FormData).toBeTrue();
    upload.flush({});

    service.downloadFile('demo file.txt').subscribe();
    const download = httpMock.expectOne(`${base}/files/demo%20file.txt`);
    expect(download.request.responseType).toBe('blob');
    download.flush(new Blob(['demo']));

    service.deleteAttachment(7).subscribe();
    const deleteAttachment = httpMock.expectOne(`${base}/attachments/7`);
    expect(deleteAttachment.request.method).toBe('DELETE');
    deleteAttachment.flush({});
  });
});
