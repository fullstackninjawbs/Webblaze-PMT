import { deriveInvoiceState } from './invoice.model';

const NOW = new Date('2026-11-17T12:00:00Z');
const FUTURE = new Date('2026-12-01T00:00:00Z');
const PAST = new Date('2026-11-01T00:00:00Z');

describe('deriveInvoiceState', () => {
  it('keeps a draft with no payments as draft', () => {
    expect(deriveInvoiceState({ status: 'draft', totalAmount: 1000, dueDate: PAST }, NOW)).toEqual({
      receivedAmount: 0, pendingAmount: 1000, status: 'draft',
    });
  });

  it('marks partial and full payment correctly', () => {
    expect(deriveInvoiceState({ status: 'sent', totalAmount: 1000, paymentDetails: [{ amount: 400 }], dueDate: FUTURE }, NOW).status)
      .toBe('partially_paid');
    expect(deriveInvoiceState({ status: 'sent', totalAmount: 1000, paymentDetails: [{ amount: 600 }, { amount: 400 }], dueDate: FUTURE }, NOW))
      .toEqual({ receivedAmount: 1000, pendingAmount: 0, status: 'paid' });
  });

  it('goes back to sent when all payments are removed', () => {
    expect(deriveInvoiceState({ status: 'paid', totalAmount: 1000, paymentDetails: [], dueDate: FUTURE }, NOW).status).toBe('sent');
  });

  it('does not let a "paid" status stand without payments', () => {
    expect(deriveInvoiceState({ status: 'paid', totalAmount: 500, dueDate: FUTURE }, NOW))
      .toEqual({ receivedAmount: 0, pendingAmount: 500, status: 'sent' });
  });

  it('marks issued invoices past their due date as overdue', () => {
    expect(deriveInvoiceState({ status: 'sent', totalAmount: 1000, dueDate: PAST }, NOW).status).toBe('overdue');
    expect(deriveInvoiceState({ status: 'sent', totalAmount: 1000, paymentDetails: [{ amount: 200 }], dueDate: PAST }, NOW).status).toBe('overdue');
  });

  it('never reports a negative pending amount', () => {
    expect(deriveInvoiceState({ status: 'sent', totalAmount: 100, paymentDetails: [{ amount: 150 }], dueDate: FUTURE }, NOW).pendingAmount).toBe(0);
  });

  it('avoids floating point drift in money sums', () => {
    expect(deriveInvoiceState({ status: 'sent', totalAmount: 0.3, paymentDetails: [{ amount: 0.1 }, { amount: 0.2 }], dueDate: FUTURE }, NOW))
      .toEqual({ receivedAmount: 0.3, pendingAmount: 0, status: 'paid' });
  });
});
