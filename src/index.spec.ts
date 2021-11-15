import Trace from '.';
import { Logger } from './types';

let logger: Logger;

beforeEach(async () => {
  logger = {
    info: jest.fn(),
    error: jest.fn(),
  };
});

it('calls logger with input and output', () => {
  @Trace({ logger })
  class UserRepository {
    create(name: string) {
      return { id: 1, name };
    }
  }

  new UserRepository().create('Aymeric');

  expect(logger.info).toHaveBeenNthCalledWith(1, '› userRepository.create', {
    input: ['Aymeric'],
  });
  expect(logger.info).toHaveBeenNthCalledWith(2, '‹ userRepository.create', {
    output: { id: 1, name: 'Aymeric' },
    executionMs: expect.any(Number),
  });
});

it('keeps "this" untouched', () => {
  @Trace({ logger })
  class UserRepository {
    constructor(private idGenerator = 1) {}

    create(name: string) {
      return { id: this.idGenerator++, name };
    }
  }

  new UserRepository().create('Aymeric');

  expect(logger.info).toHaveBeenNthCalledWith(2, '‹ userRepository.create', {
    output: { id: 1, name: 'Aymeric' },
    executionMs: expect.any(Number),
  });
});

it('logs when method throws', () => {
  @Trace({ logger })
  class UserRepository {
    create(name: string) {
      throw new Error('Not implemented');
    }
  }

  expect(() => new UserRepository().create('Aymeric')).toThrow(
    new Error('Not implemented'),
  );

  expect(logger.info).toHaveBeenNthCalledWith(1, '› userRepository.create', {
    input: ['Aymeric'],
  });
  expect(logger.error).toHaveBeenNthCalledWith(1, '‹ userRepository.create', {
    error: new Error('Not implemented'),
    executionMs: expect.any(Number),
  });
});

it('logs when method returns a promise', async () => {
  @Trace({ logger })
  class UserRepository {
    async create(name: string) {
      return { id: 1, name };
    }
  }

  await new UserRepository().create('Aymeric');

  expect(logger.info).toHaveBeenNthCalledWith(
    2,
    '‹ await userRepository.create',
    {
      output: { id: 1, name: 'Aymeric' },
      executionMs: expect.any(Number),
    },
  );
});

it('logs when method rejects', async () => {
  @Trace({ logger })
  class UserRepository {
    async create(name: string) {
      throw new Error('Not implemented');
    }
  }

  await expect(new UserRepository().create('Aymeric')).rejects.toThrow(
    new Error('Not implemented'),
  );

  expect(logger.error).toHaveBeenNthCalledWith(
    1,
    '‹ await userRepository.create',
    {
      error: new Error('Not implemented'),
      executionMs: expect.any(Number),
    },
  );
});

it('logs input output on static methods', async () => {
  @Trace({ logger })
  class UserRepository {
    static create(name: string) {
      return { id: 1, name };
    }
  }

  UserRepository.create('Aymeric');

  expect(logger.info).toHaveBeenNthCalledWith(1, '› UserRepository.create', {
    input: ['Aymeric'],
  });
  expect(logger.info).toHaveBeenNthCalledWith(2, '‹ UserRepository.create', {
    output: { id: 1, name: 'Aymeric' },
    executionMs: expect.any(Number),
  });
});
