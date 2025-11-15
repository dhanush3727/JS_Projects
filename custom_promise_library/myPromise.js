// Custom Promise Library
// This is the possible states of the promise
const STATES = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

// Custom Promise Implementation
class MyPromise {
  // Private fields
  #onFulfilledCallbacks = []; // To handle fulfilled callbacks
  #onRejectedCallbacks = []; // To handle rejected callbacks
  #state = STATES.PENDING; // Initial state
  #value = null; // Fulfilled value
  #reason = null; // Rejection reason
  // We set the resolve and reject methods as private so if we use them in executor first bind this to the current instance, if we don't do this, we lose their connection
  #resolveBind = this.#resolve.bind(this);
  #rejectBind = this.#reject.bind(this);

  // Constructor
  constructor(executor) {
    // Execute the executor function immediately
    try {
      executor(this.#resolveBind, this.#rejectBind); // Pass bound resolve and reject methods
    } catch (err) {
      this.#reject(err); // If executor throws, reject the promise
    }
  }

  // Resolve method to handle fulfillment
  #resolve(value) {
    // State can only be changed if it's pending
    if (this.#state === STATES.PENDING) {
      this.#state = STATES.FULFILLED; // Update state to fulfilled
      this.#value = value; // Store the fulfilled value
      // Execute all stored fulfilled callbacks asynchronously - using queueMicrotask to ensure they run after the current execution context
      queueMicrotask(() => {
        this.#onFulfilledCallbacks.forEach((cb) => cb(this.#value)); // Call each callback with the fulfilled value
        // Clear callbacks after execution
        this.#onFulfilledCallbacks = [];
        this.#onRejectedCallbacks = [];
      });
    }
  }

  // Reject method to handle rejection
  #reject(reason) {
    // State can only be changed if it's pending
    if (this.#state === STATES.PENDING) {
      this.#state = STATES.REJECTED; // Update state to rejected
      this.#reason = reason; // Store the rejection reason
      // Execute all stored rejected callbacks asynchronously
      queueMicrotask(() => {
        this.#onRejectedCallbacks.forEach((cb) => cb(this.#reason)); // Call each callback with the rejection reason
        // Clear callbacks after execution
        this.#onRejectedCallbacks = [];
        this.#onFulfilledCallbacks = [];
      });
    }
  }

  // Then method for chaining
  then(onFulfilled, onRejected) {
    // Return a new promise for chaining
    return new MyPromise((resolve, reject) => {
      // Helper functions to handle fulfillment
      const handleFulfilled = (value) => {
        // Wrap in try-catch to handle errors in callbacks
        try {
          // If onFulfilled is a function, call it with the value
          if (typeof onFulfilled === "function") {
            const result = onFulfilled(value); // Get the result from the callback
            // If the result is a MyPromise, chain it; otherwise, resolve with the result
            result instanceof MyPromise
              ? result.then(resolve, reject)
              : resolve(result);
          } else {
            // If no onFulfilled provided, pass the value through
            resolve(value);
          }
        } catch (err) {
          // If an error occurs, reject the new promise
          reject(err);
        }
      };

      // Helper functions to handle rejection
      const handleRejected = (reason) => {
        // Wrap in try-catch to handle errors in callbacks
        try {
          // If onRejected is a function, call it with the reason
          if (typeof onRejected === "function") {
            const result = onRejected(reason); // Get the result from the callback
            // If the result is a MyPromise, chain it; otherwise, resolve with the result
            result instanceof MyPromise
              ? result.then(resolve, reject)
              : resolve(result);
          } else {
            // If no onRejected provided, pass the reason through
            reject(reason);
          }
        } catch (err) {
          // If an error occurs, reject the new promise
          reject(err);
        }
      };

      // Depending on the current state, handle accordingly
      if (this.#state === STATES.FULFILLED) {
        queueMicrotask(() => handleFulfilled(this.#value)); // Handle fulfilled state asynchronously
      } else if (this.#state === STATES.REJECTED) {
        queueMicrotask(() => handleRejected(this.#reason)); // Handle rejected state asynchronously
      } else {
        // If pending, store the callbacks for later execution
        this.#onFulfilledCallbacks.push((value) =>
          queueMicrotask(() => handleFulfilled(value))
        );
        this.#onRejectedCallbacks.push((reason) =>
          queueMicrotask(() => handleRejected(reason))
        );
      }
    });
  }

  // Catch method for handling rejections
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  // Finally method for cleanup actions
  finally(onFinally) {
    //Return a promise that executes onFinally regardless of the outcome
    return this.then(
      (value) => {
        onFinally(); // Execute the finally callback
        return value; // Pass through the fulfilled value
      },
      (reason) => {
        onFinally(); // Execute the finally callback
        throw reason; // If we use return here, it would resolve the promise, we need to throw to maintain rejection
      }
    );
  }

  // Static resolve methods
  static resolve(value) {
    // If the value is already a MyPromise, return it directly
    if (value instanceof MyPromise) {
      return value;
    }

    // Otherwise, create a new fulfilled MyPromise
    return new MyPromise((resolve) => resolve(value));
  }

  // Static reject method
  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  // Static all method
  static all(promises) {
    // Return a new promise that resolves when all input promises resolve
    return new MyPromise((resolve, reject) => {
      const results = []; // To store results
      let completed = 0; // To track completed promises

      // Handle empty array case
      if (promises.length === 0) {
        return resolve([]); // Resolve immediately with an empty array
      }

      // Iterate over each promise
      promises.forEach((promise, index) => {
        // Use MyPromise.resolve to handle non-promise values
        MyPromise.resolve(promise)
          // Handle fulfillment
          .then((val) => {
            results[index] = val; // Store the result at the correct index
            completed++; // Increment the completed count
            // If all promises are completed, resolve with the results array
            if (completed === promises.length) {
              resolve(results);
            }
          })
          .catch((reason) => reject(reason)); // If any promise rejects, reject the entire promise
      });
    });
  }

  // Static race method
  static race(promises) {
    // Return a new promise that resolves or rejects as soon as one of the input promises does
    return new MyPromise((resolve, reject) => {
      // Iterate over each promise
      promises.forEach((promise) => {
        MyPromise.resolve(promise).then(resolve, reject); // Resolve or reject as soon as one promise settles
      });
    });
  }

  // Static allSettled method
  static allSettled(promises) {
    // Return a new promise that resolves when all input promises have settled
    return new MyPromise((resolve, reject) => {
      const results = []; // To store results
      let completed = 0; // To track completed promises

      // Handle empty array case
      if (promises.length === 0) {
        return resolve([]); // Resolve immediately with an empty array
      }

      // Iterate over each promise
      promises.forEach((promise, index) => {
        // Use MyPromise.resolve to handle non-promise values
        MyPromise.resolve(promise)
          // Handle both fulfillment and rejection
          .then((value) => {
            // Store the result with status fulfilled
            results[index] = {
              status: "fulfilled",
              value: value,
            };
          })
          .catch((reason) => {
            // Store the result with status rejected
            results[index] = {
              status: "rejected",
              value: reason,
            };
          })
          .finally(() => {
            completed++; // Increment the completed count
            // If all promises are completed, resolve with the results array
            if (completed === promises.length) {
              resolve(results);
            }
          });
      });
    });
  }

  // Static any method
  static any(promises) {
    // Return a new promise that resolves as soon as one of the input promises fulfills
    return new MyPromise((resolve, reject) => {
      const errors = []; // To store rejection reasons
      let rejected = 0; // To track rejected promises

      // Handle empty array case
      if (promises.length === 0) {
        return reject(new AggregateError([], "All promises were rejected"));
      }

      // Iterate over each promise
      promises.forEach((promise, index) => {
        // Use MyPromise.resolve to handle non-promise values
        MyPromise.resolve(promise)
          .then((val) => resolve(val)) // Resolve as soon as one promise fulfills
          // Handle rejection
          .catch((reason) => {
            errors[index] = reason; // Store the rejection reason
            rejected++; // Increment the rejected count
            // If all promises are rejected, reject with an AggregateError
            if (rejected === promises.length) {
              reject(new AggregateError(errors, "All promises were rejected"));
            }
          });
      });
    });
  }
}
