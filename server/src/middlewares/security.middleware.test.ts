import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { sanitizeRequest } from './sanitize.middleware';
import { validate } from './validate.middleware';
import { authMiddleware } from './auth.middleware';
import { User } from '../modules/users/user.model';

jest.mock('../modules/users/user.model', () => ({ User: { findById: jest.fn() } }));

const run = async (mw: any, req: any) => {
  const next = jest.fn();
  await mw(req, {} as any, next);
  return next;
};

describe('containsRegex', () => {
  it('treats user input literally and never throws', () => {
    const { containsRegex } = jest.requireActual('../utils/regex');
    expect(() => containsRegex('(')).not.toThrow();
    expect(containsRegex('(').test('a(b')).toBe(true);
    expect(containsRegex('a.b').test('axb')).toBe(false);
    expect(containsRegex('(a+)+$').test('x(a+)+$y')).toBe(true);
  });
});

describe('sanitizeRequest', () => {
  it('removes Mongo operators from body and query at any depth', async () => {
    const req: any = {
      body: { title: 'ok', $set: { status: 'completed' }, nested: { $where: 'x', keep: 1 }, list: [{ $ne: 1, a: 2 }] },
      query: { status: { $ne: 'done' }, page: '1' },
    };
    await run(sanitizeRequest, req);
    expect(req.body).toEqual({ title: 'ok', nested: { keep: 1 }, list: [{ a: 2 }] });
    expect(req.query).toEqual({ status: {}, page: '1' });
  });
});

describe('validate', () => {
  const schema = z.object({ body: z.object({ title: z.string(), estimatedHours: z.number().optional() }) });

  it('replaces req.body with the parsed result, dropping undeclared fields', async () => {
    const req: any = { body: { title: 'Task', spentHours: 99, status: 'completed' }, query: {}, params: {} };
    const next = await run(validate(schema), req);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ title: 'Task' });
  });

  it('rejects invalid input with a 400', async () => {
    const req: any = { body: { title: 5 }, query: {}, params: {} };
    const next = await run(validate(schema), req);
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
});

describe('authMiddleware token checks', () => {
  const ACCESS = 'test-access-secret';
  beforeAll(() => { process.env.JWT_ACCESS_SECRET = ACCESS; });
  beforeEach(() => {
    (User.findById as jest.Mock).mockResolvedValue({ _id: 'u1', isActive: true, tokenVersion: 2 });
  });

  const reqWith = (token: string): any => ({ headers: { authorization: `Bearer ${token}` } });

  it('accepts a current access token', async () => {
    const req = reqWith(jwt.sign({ id: 'u1', tokenVersion: 2, typ: 'access' }, ACCESS));
    const next = await run(authMiddleware, req);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
  });

  it('rejects a token without tokenVersion (old-style invite link)', async () => {
    const next = await run(authMiddleware, reqWith(jwt.sign({ id: 'u1', email: 'a@b.c' }, ACCESS)));
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('rejects a token of another type even if signed with the access secret', async () => {
    const next = await run(authMiddleware, reqWith(jwt.sign({ id: 'u1', tokenVersion: 2, typ: 'invite' }, ACCESS)));
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('rejects a token from before a password reset (stale tokenVersion)', async () => {
    const next = await run(authMiddleware, reqWith(jwt.sign({ id: 'u1', tokenVersion: 1, typ: 'access' }, ACCESS)));
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});
