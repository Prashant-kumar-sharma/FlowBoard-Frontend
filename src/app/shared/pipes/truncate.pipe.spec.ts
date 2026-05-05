import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('truncates long values and leaves shorter values unchanged', () => {
    expect(pipe.transform('abcdefghij', 5)).toBe('abcde...');
    expect(pipe.transform('short', 10)).toBe('short');
    expect(pipe.transform('', 10)).toBe('');
  });
});
