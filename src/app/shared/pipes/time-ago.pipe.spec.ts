import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => {
    pipe = new TimeAgoPipe();
  });

  it('formats recent timestamps across all display ranges', () => {
    jasmine.clock().install();
    const now = new Date('2026-05-04T10:00:00Z');
    jasmine.clock().mockDate(now);

    expect(pipe.transform('2026-05-04T09:59:45Z')).toBe('just now');
    expect(pipe.transform('2026-05-04T09:30:00Z')).toBe('30m ago');
    expect(pipe.transform('2026-05-04T06:00:00Z')).toBe('4h ago');
    expect(pipe.transform('2026-05-01T10:00:00Z')).toBe('3d ago');

    jasmine.clock().uninstall();
  });
});
