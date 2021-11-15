import Trace from '.';
import { Logger } from './types';

let logger: Logger;

beforeEach(async () => {
  logger = {
    info: jest.fn(),
    error: jest.fn(),
  };
});

it('calls logger with input and output', async () => {
  @Trace({ logger })
  class UserRepository {
    create(name: string) {
      return { id: 1, name };
    }
  }

  new UserRepository().create('Aymeric');

  expect(logger.info).toHaveBeenNthCalledWith(1, '› UserRepository.create', {
    input: ['Aymeric'],
  });
  expect(logger.info).toHaveBeenNthCalledWith(2, '‹ UserRepository.create', {
    output: { id: 1, name: 'Aymeric' },
  });
});
