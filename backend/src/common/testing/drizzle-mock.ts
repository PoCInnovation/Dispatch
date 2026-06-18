/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { Database } from '../../database/database.module';

/**
 * Thenable proxy: every property access and every call returns the same
 * proxy, and `await`ing anywhere in the chain resolves to the provided
 * value. Used to stub Drizzle query chains in unit tests.
 */
export function chainResolve<T>(value: T): any {
  const proxy: any = new Proxy(() => proxy, {
    get(_, prop) {
      if (prop === 'then') {
        return (resolve: (v: T) => unknown) => resolve(value);
      }
      return () => proxy;
    },
  });
  return proxy;
}

export interface MockDb {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

export function createMockDb(): MockDb {
  return {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

export function asDatabase(mock: MockDb): Database {
  return mock as unknown as Database;
}
