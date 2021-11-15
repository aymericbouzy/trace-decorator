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
        const execution = new Execution(
          `${classConstructor.name}.${methodName}`,
          logger,
        );
        execution.input([...arguments]);

        try {
          const result = method.call(this, ...arguments);

          if (isThenable(result)) {
            return result.then(
              (awaitedResult) => {
                execution.output(
                  'info',
                  awaitedResult,
                  (methodName) => `await ${methodName}`,
                );

                return awaitedResult;
              },
              (error) => {
                execution.output(
                  'error',
                  error,
                  (methodName) => `await ${methodName}`,
                );

                throw error;
              },
            );
          }

          execution.output('info', result);

          return result;
        } catch (error) {
          execution.output('error', error);

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

class Execution {
  start = new Date();

  constructor(private methodName: string, private logger: Logger) {}

  input(input: unknown) {
    this.logger.info(`› ${this.methodName}`, { input });
  }

  output(
    type: 'error' | 'info',
    output: unknown,
    decorate = (methodName: string) => methodName,
  ) {
    this.logger[type](`‹ ${decorate(this.methodName)}`, {
      [type === 'error' ? 'error' : 'output']: output,
      executionMs: new Date().valueOf() - this.start.valueOf(),
    });
  }
}
