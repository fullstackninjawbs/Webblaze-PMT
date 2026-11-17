import { mergeRawEntries } from './dailyStatus.service';

describe('mergeRawEntries (one report per day)', () => {
  it('keeps a task once and lets the newer text win', () => {
    const merged = mergeRawEntries(
      [{ task: 't1', title: 'Header work' }],
      [{ task: 't1', title: 'Header work, mega menu fixed' }]
    );
    expect(merged).toEqual([{ task: 't1', title: 'Header work, mega menu fixed' }]);
  });

  it('appends new lines after existing ones', () => {
    const merged = mergeRawEntries(
      [{ task: 't1', title: 'Task one' }, { title: 'Call with client' }],
      [{ task: 't2', title: 'Task two' }, { title: 'Reviewed PR' }]
    );
    expect(merged.map((e) => e.title)).toEqual(['Task one', 'Call with client', 'Task two', 'Reviewed PR']);
  });

  it('drops duplicate free-text lines regardless of case, and blank lines', () => {
    const merged = mergeRawEntries(
      [{ title: 'Fixed layout issues' }],
      [{ title: 'fixed layout issues' }, { title: '   ' }]
    );
    expect(merged).toEqual([{ title: 'Fixed layout issues' }]);
  });
});
