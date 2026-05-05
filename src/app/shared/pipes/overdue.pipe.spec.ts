import { OverduePipe } from './overdue.pipe';

describe('OverduePipe', () => {
  let pipe: OverduePipe;

  beforeEach(() => {
    pipe = new OverduePipe();
  });

  it('returns false for missing due dates or done cards and true for overdue items', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-05-04T10:00:00Z'));

    expect(pipe.transform(undefined, 'TODO')).toBeFalse();
    expect(pipe.transform('2026-05-03T10:00:00Z', 'DONE')).toBeFalse();
    expect(pipe.transform('2026-05-03T10:00:00Z', 'TODO')).toBeTrue();
    expect(pipe.transform('2026-05-05T10:00:00Z', 'TODO')).toBeFalse();

    jasmine.clock().uninstall();
  });
});
