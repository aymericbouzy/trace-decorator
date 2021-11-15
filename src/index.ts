import { Logger } from './types';

interface Constructor {
  new (...args: any[]): any;
}

export default function Trace({ logger = console }: { logger?: Logger }) {
  return <C extends Constructor>(classConstructor: C) => {
    const methodNames = Object.getOwnPropertyNames(classConstructor.prototype);

    for (const methodName of methodNames) {
      const method: Function = classConstructor.prototype[methodName];
      classConstructor.prototype[methodName] = function () {
        logger.info(`› ${classConstructor.name}.${methodName}`, {
          input: [...arguments],
        });

        const start = new Date();

        try {
          const result = method.call(this, ...arguments);

          if (isThenable(result)) {
            return result.then(
              (awaitedResult) => {
                logger.info(`‹ await ${classConstructor.name}.${methodName}`, {
                  output: awaitedResult,
                  executionMs: new Date().valueOf() - start.valueOf(),
                });

                return awaitedResult;
              },
              (error) => {
                logger.error(`‹ await ${classConstructor.name}.${methodName}`, {
                  error,
                  executionMs: new Date().valueOf() - start.valueOf(),
                });

                throw error;
              },
            );
          }

          logger.info(`‹ ${classConstructor.name}.${methodName}`, {
            output: result,
            executionMs: new Date().valueOf() - start.valueOf(),
          });

          return result;
        } catch (error) {
          logger.error(`‹ ${classConstructor.name}.${methodName}`, {
            error,
            executionMs: new Date().valueOf() - start.valueOf(),
          });

          throw error;
        }
      };
    }

    return classConstructor;
  };
}

function isThenable(variable: unknown): variable is PromiseLike<unknown> {
  return (
    variable instanceof Object &&
    // @ts-expect-error
    typeof variable.then === 'function'
  );
}
