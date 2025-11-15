# Custom Promise Library

In this project, I am going to do a custom promise library in javascript, that means I will recrating the functionality of JS's native Promise from scratch using plain javascript without using promise & async/await keywords.

## Features

I'll implement the features like:
- new MyPromise((resolve, reject)=>{})
- .then(), .catch(), .finally().
- static methods like MyPromise.all(), MyPromise.race(), MyPromise.allSettled().
- and handle async chaining, state transitions and error propagation.

## Explanation
```javascript
const STATES = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};
```
This code defines an object `STATES` that contains three properties representing the possible states of a promise: `Pending`, `Fulfilled`, and `Rejected`. These states are used to track the status of a promise during its lifecycle.

```javascript
class MyPromise {
  #onFulfilledCallbacks = [];
  #onRejectedCallbacks = [];
  #state = STATES.PENDING;
  #value = null;
  #reason = null;
  #resolveBind = this.#resolve.bind(this);
  #rejectBind = this.#reject.bind(this);

  constructor(executor) {
    try {
      executor(this.#resolveBind, this.#rejectBind);
    } catch (err) {
      this.#reject(err);
    }
  }
}
```
This code defines a custom `MyPromise` class that mimics the behavior of JavaScript's native Promise. It initializes private properties to manage the promise's state, value, and callbacks for fulfillment and rejection. The constructor takes an executor function, which is called immediately with bound resolve and reject methods. If the executor throws an error, the promise is rejected with that error.

```javascript
#resolve(value) {
    if (this.#state === STATES.PENDING) {
      this.#state = STATES.FULFILLED;
      this.#value = value;
      queueMicrotask(() => {
        this.#onFulfilledCallbacks.forEach((cb) => cb(this.#value));
        this.#onFulfilledCallbacks = [];
        this.#onRejectedCallbacks = [];
      });
    }
  }
```
This code defines a private method `#resolve` within the `MyPromise` class. It is responsible for transitioning the promise from the `Pending` state to the `Fulfilled` state. When called with a value, it updates the promise's state and value, and then schedules the execution of all registered fulfillment callbacks using `queueMicrotask`. This ensures that the callbacks are executed asynchronously after the current execution context completes. After executing the callbacks, it clears both the fulfillment and rejection callback arrays to prevent memory leaks.

```javascript
#reject(reason) {
    if (this.#state === STATES.PENDING) {
      this.#state = STATES.REJECTED;
      this.#reason = reason;
      queueMicrotask(() => {
        this.#onRejectedCallbacks.forEach((cb) => cb(this.#reason));
        this.#onRejectedCallbacks = [];
        this.#onFulfilledCallbacks = [];
      });
    }
  }
```
This code defines a private method `#reject` within the `MyPromise` class. It is responsible for transitioning the promise from the `Pending` state to the `Rejected` state. When called with a reason, it updates the promise's state and reason, and then schedules the execution of all registered rejection callbacks using `queueMicrotask`. This ensures that the callbacks are executed asynchronously after the current execution context completes. After executing the callbacks, it clears both the rejection and fulfillment callback arrays to prevent memory leaks.

```javascript
then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handleFulfilled = (value) => {
        try {
          if (typeof onFulfilled === "function") {
            const result = onFulfilled(value);
            result instanceof MyPromise
              ? result.then(resolve, reject)
              : resolve(result);
          } else {
            resolve(value);
          }
        } catch (err) {
          reject(err);
        }
      };

      const handleRejected = (reason) => {
        try {
          if (typeof onRejected === "function") {
            const result = onRejected(reason);
            result instanceof MyPromise
              ? result.then(resolve, reject)
              : resolve(result);
          } else {
            reject(reason);
          }
        } catch (err) {
          reject(err);
        }
      };

      if (this.#state === STATES.FULFILLED) {
        queueMicrotask(() => handleFulfilled(this.#value));
      } else if (this.#state === STATES.REJECTED) {
        queueMicrotask(() => handleRejected(this.#reason));
      } else {
        this.#onFulfilledCallbacks.push((value) =>
          queueMicrotask(() => handleFulfilled(value))
        );
        this.#onRejectedCallbacks.push((reason) =>
          queueMicrotask(() => handleRejected(reason))
        );
      }
    });
  }
```
This code defines the `then` method for the `MyPromise` class, which allows chaining of asynchronous operations. It takes two optional callback functions: `onFulfilled` for handling successful resolution and `onRejected` for handling rejection. The method returns a new `MyPromise` instance. Inside the `then` method, two helper functions, `handleFulfilled` and `handleRejected`, are defined to process the fulfillment and rejection cases, respectively. These functions execute the provided callbacks, handle any returned promises, and manage error propagation. Depending on the current state of the promise, the appropriate handler is invoked immediately or the callbacks are queued for later execution when the promise settles.

```javascript
const handleFulfilled = (value) => {
  try {
    if (typeof onFulfilled === "function") {
      const result = onFulfilled(value);
      result instanceof MyPromise
        ? result.then(resolve, reject)
        : resolve(result);
    } else {
      resolve(value);
    }
  } catch (err) {
    reject(err);
  }
};
```
This code defines a helper function `handleFulfilled` used within the `then` method of the `MyPromise` class. It processes the fulfillment of the promise by checking if the `onFulfilled` callback is a function. If it is, the function is called with the resolved value, and if the result is another `MyPromise`, it chains the resolution or rejection to the new promise. If the result is not a promise, it resolves the new promise with that result. If `onFulfilled` is not a function, it simply resolves the new promise with the original value. The function also includes error handling to catch any exceptions thrown during execution and rejects the new promise accordingly.

```javascript
const handleRejected = (reason) => {
  try {
    if (typeof onRejected === "function") {
      const result = onRejected(reason);
      result instanceof MyPromise
        ? result.then(resolve, reject)
        : resolve(result);
    } else {
      reject(reason);
    }
  } catch (err) {
    reject(err);
  }
};
```
This code defines a helper function `handleRejected` used within the `then` method of the `MyPromise` class. It processes the rejection of the promise by checking if the `onRejected` callback is a function. If it is, the function is called with the rejection reason, and if the result is another `MyPromise`, it chains the resolution or rejection to the new promise. If the result is not a promise, it resolves the new promise with that result. If `onRejected` is not a function, it simply rejects the new promise with the original reason. The function also includes error handling to catch any exceptions thrown during execution and rejects the new promise accordingly.

```javascript
if (this.#state === STATES.FULFILLED) {
  queueMicrotask(() => handleFulfilled(this.#value));
} else if (this.#state === STATES.REJECTED) {
  queueMicrotask(() => handleRejected(this.#reason));
} else {
  this.#onFulfilledCallbacks.push((value) =>
    queueMicrotask(() => handleFulfilled(value))
  );
  this.#onRejectedCallbacks.push((reason) =>
    queueMicrotask(() => handleRejected(reason))
  );
}
```
This code snippet is part of the `then` method in the `MyPromise` class. It checks the current state of the promise and determines how to handle the fulfillment or rejection. If the promise is already fulfilled, it schedules the `handleFulfilled` function to be called with the resolved value using `queueMicrotask`. If the promise is rejected, it schedules the `handleRejected` function with the rejection reason. If the promise is still pending, it adds the `handleFulfilled` and `handleRejected` functions to their respective callback arrays, ensuring they will be executed later when the promise settles. This approach maintains the asynchronous nature of promise handling.

```javascript
catch(onRejected) {
    return this.then(null, onRejected);
  }
```
This code defines the `catch` method for the `MyPromise` class. The `catch` method is a shorthand for handling promise rejections. It takes a single callback function, `onRejected`, which is called when the promise is rejected. Internally, it calls the `then` method with `null` as the first argument (indicating no action on fulfillment) and `onRejected` as the second argument to handle rejection. This allows users to easily attach rejection handlers to their promises without needing to provide a fulfillment handler.

```javascript
finally(onFinally) {
    return this.then(
      (value) => {
        onFinally();
        return value;
      },
      (reason) => {
        onFinally();
        throw reason;
      }
    );
  }
```
This code defines the `finally` method for the `MyPromise` class. The `finally` method allows users to specify a callback function, `onFinally`, that will be executed regardless of whether the promise is fulfilled or rejected. It calls the `then` method with two handlers: one for fulfillment and one for rejection. In both handlers, it invokes the `onFinally` callback and then either returns the original value (in the case of fulfillment) or rethrows the original reason (in the case of rejection). This ensures that any cleanup or final actions can be performed after the promise settles, without altering the outcome of the promise chain.

```javascript
static resolve(value) {
    if (value instanceof MyPromise) {
      return value;
    }
    return new MyPromise((resolve) => resolve(value));
  }
```
This code defines a static method `resolve` for the `MyPromise` class. The `resolve` method is used to create a new `MyPromise` that is immediately fulfilled with the given value. If the provided value is already an instance of `MyPromise`, it simply returns that instance. Otherwise, it creates a new `MyPromise` and calls its executor function, which resolves the promise with the provided value. This method is useful for converting non-promise values into promises or for returning existing promises without modification.

```javascript
static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }
```
This code defines a static method `reject` for the `MyPromise` class. The `reject` method is used to create a new `MyPromise` that is immediately rejected with the given reason. It creates a new `MyPromise` and calls its executor function, which invokes the `reject` callback with the provided reason. This method is useful for creating promises that represent failure or error conditions.

```javascript
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let completed = 0;

      if (promises.length === 0) {
        return resolve([]);
      }

      promises.forEach((promise, index) => {
        MyPromise.resolve(promise)
          .then((val) => {
            results[index] = val;
            completed++;
            if (completed === promises.length) {
              resolve(results);
            }
          })
          .catch((reason) => reject(reason));
      });
    });
  }
```
This code defines a static method `all` for the `MyPromise` class. The `all` method takes an array of promises (or values) and returns a new `MyPromise` that resolves when all the input promises have resolved, or rejects if any of them reject. It initializes an empty array `results` to store the resolved values and a counter `completed` to track how many promises have resolved. If the input array is empty, it immediately resolves with an empty array. For each promise in the input array, it uses `MyPromise.resolve` to ensure it is treated as a promise, then attaches `then` and `catch` handlers. When a promise resolves, its value is stored in the `results` array at the corresponding index, and the `completed` counter is incremented. If all promises resolve, it resolves the new promise with the `results` array. If any promise rejects, it immediately rejects the new promise with the rejection reason.

```javascript
static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach((promise) => {
        MyPromise.resolve(promise).then(resolve, reject);
      });
    });
  }
```
This code defines a static method `race` for the `MyPromise` class. The `race` method takes an array of promises (or values) and returns a new `MyPromise` that resolves or rejects as soon as one of the input promises resolves or rejects. It iterates over each promise in the input array, using `MyPromise.resolve` to ensure each item is treated as a promise. It then attaches `then` and `catch` handlers to each promise, passing the `resolve` and `reject` functions of the new promise. This means that whichever promise settles first (either resolves or rejects) will determine the outcome of the new promise returned by `race`.

```javascript
static allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let completed = 0;

      if (promises.length === 0) {
        return resolve([]);
      }

      promises.forEach((promise, index) => {
        MyPromise.resolve(promise)
          .then((value) => {
            results[index] = {
              status: "fulfilled",
              value: value,
            };
          })
          .catch((reason) => {
            results[index] = {
              status: "rejected",
              value: reason,
            };
          })
          .finally(() => {
            completed++;
            if (completed === promises.length) {
              resolve(results);
            }
          });
      });
    });
  }
```
This code defines a static method `allSettled` for the `MyPromise` class. The `allSettled` method takes an array of promises (or values) and returns a new `MyPromise` that resolves when all the input promises have settled, meaning they have either fulfilled or rejected. It initializes an empty array `results` to store the outcome of each promise and a counter `completed` to track how many promises have settled. If the input array is empty, it immediately resolves with an empty array. For each promise in the input array, it uses `MyPromise.resolve` to ensure it is treated as a promise, then attaches `then`, `catch`, and `finally` handlers. When a promise fulfills, it stores an object with the status "fulfilled" and the value in the `results` array at the corresponding index. If a promise rejects, it stores an object with the status "rejected" and the reason. The `finally` handler increments the `completed` counter, and when all promises have settled, it resolves the new promise with the `results` array.

```javascript
static any(promises) {
    return new MyPromise((resolve, reject) => {
      const errors = [];
      let rejected = 0;

      if (promises.length === 0) {
        return reject(new AggregateError([], "All promises were rejected"));
      }

      promises.forEach((promise, index) => {
        MyPromise.resolve(promise)
          .then((val) => resolve(val))
          .catch((reason) => {
            errors[index] = reason;
            rejected++;
            if (rejected === promises.length) {
              reject(new AggregateError(errors, "All promises were rejected"));
            }
          });
      });
    });
  }
```
This code defines a static method `any` for the `MyPromise` class. The `any` method takes an array of promises (or values) and returns a new `MyPromise` that resolves as soon as one of the input promises fulfills, or rejects if all of them reject. It initializes an empty array `errors` to store the rejection reasons and a counter `rejected` to track how many promises have rejected. If the input array is empty, it immediately rejects with an `AggregateError` indicating that all promises were rejected. For each promise in the input array, it uses `MyPromise.resolve` to ensure it is treated as a promise, then attaches `then` and `catch` handlers. When a promise fulfills, it immediately resolves the new promise with that value. If a promise rejects, it stores the reason in the `errors` array at the corresponding index and increments the `rejected` counter. If all promises reject, it rejects the new promise with an `AggregateError` containing all the rejection reasons.
