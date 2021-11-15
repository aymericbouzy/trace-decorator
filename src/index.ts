import { Logger } from './types';

interface Constructor<T> {
  new (...args: unknown[]): T;
}

export default function Trace({ logger = console }: { logger?: Logger }) {
  return <T>(classConstructor: Constructor<T>) => {
    const methodNames = Object.getOwnPropertyNames(classConstructor.prototype);

    for (const methodName of methodNames) {
      const method: Function = classConstructor.prototype[methodName];
      classConstructor.prototype[methodName] = function () {
        logger.info(`› ${classConstructor.name}.${methodName}`, {
          input: [...arguments],
        });
        try {
          const result = method.call(this, ...arguments);

          if (isThenable(result)) {
            return result.then((awaitedResult) => {
              logger.info(`‹ await ${classConstructor.name}.${methodName}`, {
                output: awaitedResult,
              });

              return awaitedResult;
            });
          }

          logger.info(`‹ ${classConstructor.name}.${methodName}`, {
            output: result,
          });

          return result;
        } catch (error) {
          logger.error(`‹ ${classConstructor.name}.${methodName}`, {
            error,
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
