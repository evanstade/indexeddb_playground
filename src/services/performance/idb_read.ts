import {handleError} from 'services/error';
import {fakeGithubResponse, generateString, generateRandomString} from 'services/mock_data';
import {PerformanceTestCase} from 'services/performance/performance';

const CONTEXT = 'idb_read';

// Fills the `entries` object store with multiple records with different (and randomized) values.
function prepDifferentStrings(iteration: number, strLen : number) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('idb-playground-benchmark', 1);
    request.onerror = () => {
      handleError(request.error!, CONTEXT, reject);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('entries', {
        keyPath: 'key',
      });
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('entries', 'readwrite');
      const store = transaction.objectStore('entries');
      for (let i = 0; i < iteration; ++i) {
        store.add({key: `doc_${i}`, value: generateRandomString(strLen)});
      }
      transaction.onerror = () => {
        handleError(transaction.error!, CONTEXT, reject);
      };
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
    };
  });
}

// Fills the `entries` object store with records with the same value.
function prep(iteration: number, blob: string|object) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('idb-playground-benchmark', 1);
    request.onerror = () => {
      handleError(request.error!, CONTEXT, reject);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('entries', {
        keyPath: 'key',
      });
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('entries', 'readwrite');
      const store = transaction.objectStore('entries');
      for (let i = 0; i < iteration; ++i) {
        store.add({key: `doc_${i}`, blob});
      }
      transaction.onerror = () => {
        handleError(transaction.error!, CONTEXT, reject);
      };
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
    };
  });
}

function cleanup() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('idb-playground-benchmark');
    request.onerror = () => {
      handleError(request.error!, CONTEXT, reject);
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}

function benchmarkReadGetOne() {
  return new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('idb-playground-benchmark', 1);

    request.onsuccess = () => {
      const results: Record<string, {}> = {};
      const db = request.result;
      const start = performance.now();
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const getRequest = store.get('doc_1');
      getRequest.onsuccess = () => {
        results['doc_1'] = getRequest.result;
      };
      getRequest.onerror = () => {
        handleError(getRequest.error!, CONTEXT, reject);
      };
      transaction.oncomplete = () => {
        const end = performance.now();
        db.close();
        resolve(end - start);
      }
    };
  });
}

function getKeys() {
  return new Promise<string[]>((resolve, reject) => {
    const request = indexedDB.open('idb-playground-benchmark', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const getAllRequest = store.getAllKeys();
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result as string[]);
      };
      db.close();
    };
    request.onerror = () => {
      handleError(request.error!, CONTEXT, reject);
    }
  });
}

function benchmarkReadGetAll() {
  return new Promise<number>((resolve, reject) => {
    const results: Record<string, {}> = {};
    const request = indexedDB.open('idb-playground-benchmark', 1);

    request.onsuccess = () => {
      const db = request.result;
      const start = performance.now();
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result;
        items.forEach((item: {key: string; blob: string}) => {
          results[item.key] = item.blob;
        });
      };
      getAllRequest.onerror = () => {
        handleError(getAllRequest.error!, CONTEXT, reject);
      };
      transaction.oncomplete = () => {
        const end = performance.now();
        db.close();
        resolve(end - start);
      }
    };
  });
}

// Reads a certain number of values in a randomized order.
function benchmarkReadParallelGet(fetchCount : number) {
  return new Promise<number>((resolve, reject) => {
    const results: Record<string, {}> = {};
    const request = indexedDB.open('idb-playground-benchmark', 1);

    request.onsuccess = async () => {
      const db = request.result;
      const keys = await getKeys();
      const start = performance.now();
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      for (let i = 0; i < fetchCount; ++i) {
        const getRequest = store.get(keys[Math.floor(Math.random() * i)]);
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          results[item.key] = item.blob;
        };
      }
      transaction.onerror = () => {
        handleError(transaction.error!, CONTEXT, reject);
      };
      transaction.oncomplete = () => {
        const end = performance.now();
        db.close();
        resolve(end - start);
      }
    };
  });
}

function readItem(
    store: IDBObjectStore, results: Record<string, {}>, keys: string[],
    index: number) {
  if (index >= keys.length) {
    return;
  }
  const getRequest = store.get(keys[index]);
  getRequest.onsuccess = () => {
    const item = getRequest.result;
    results[item.key] = item.blob;
    readItem(store, results, keys, index + 1);
  };
}

function benchmarkReadSerialGet() {
  return new Promise<number>((resolve, reject) => {
    const results: Record<string, {}> = {};
    const request = indexedDB.open('idb-playground-benchmark', 1);

    request.onsuccess = async () => {
      const db = request.result;
      const keys = await getKeys();
      const start = performance.now();
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      readItem(store, results, keys, 0);

      transaction.onerror = () => {
        handleError(transaction.error!, CONTEXT, reject);
      };
      transaction.oncomplete = () => {
        const end = performance.now();
        db.close();
        resolve(end - start);
      };
    };
    request.onerror = () => {
      handleError(request.error!, CONTEXT, reject);
    };
  });
}

function benchmarkReadCursor() {
  return new Promise<number>((resolve, reject) => {
    const results: Record<string, {}> = {};
    const request = indexedDB.open('idb-playground-benchmark', 1);

    request.onsuccess = (e) => {
      const db = request.result;
      const start = performance.now();
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          results[cursor.key as string] = cursor.value;
          cursor.continue();
        }
      };
      cursorRequest.onerror = () => {
        handleError(cursorRequest.error!, CONTEXT, reject);
      };
      transaction.oncomplete = () => {
        const end = performance.now();
        db.close();
        resolve(end - start);
      }
    };
  });
}

const baseCase = {
  // idb tests are really slow. Only run 100 iterations.
  iteration: 100,
  cleanup,
};

const readJSON: PerformanceTestCase = {
  ...baseCase,
  benchmark: () => benchmarkReadGetOne(),
  name: 'idbReadJSON',
  label: 'idb read 70KB JSON',
  prep: () => prep(10, fakeGithubResponse),
};

const read1MB: PerformanceTestCase = {
  ...baseCase,
  benchmark: () => benchmarkReadGetOne(),
  name: 'idbRead1MB',
  label: 'idb read 1MB',
  prep: () => prep(10, generateString(1024)),
};

const read1KB: PerformanceTestCase = {
  ...baseCase,
  benchmark: () => benchmarkReadGetOne(),
  name: 'idbRead1KB',
  label: 'idb read 1KB',
  prep: () => prep(10, generateString(1)),
};

const getAllBaseCase = {
  ...baseCase,
  benchmark: () => benchmarkReadGetAll(),
};

const read1024x100BGetAll: PerformanceTestCase = {
  ...getAllBaseCase,
  name: 'idbRead1024x100BGetAll',
  label: 'idb read 1024x100B with getAll',
  prep: () => prep(1024, generateString(100 / 1024)),
};

const read100x1KBGetAll: PerformanceTestCase = {
  ...getAllBaseCase,
  name: 'idbRead100x1KBGetAll',
  label: 'idb read 100x1KB with getAll',
  prep: () => prep(100, generateString(1)),
};

const read100x1KBParallelGet: PerformanceTestCase = {
  ...baseCase,
  name: 'idbRead100x1KBParallelGet',
  label: 'idb read 100x1KB by sending get requests in parallel. Values are repetitive. Database size is tiny.',
  prep: () => prep(100, generateString(1)),
  benchmark: () => benchmarkReadParallelGet(100),
}

const readFromLargeDatabase: PerformanceTestCase = {
  ...baseCase,
  name: 'idbReadFromLargeDatabase',
  label: 'idb read 100x1KB by sending get requests in parallel. Values are randomized. Database size is large.',
  prep: () => prepDifferentStrings(100000, 1),
  benchmark: () => benchmarkReadParallelGet(100),
}

const readRepetitiveFromLargeDatabase: PerformanceTestCase = {
  ...baseCase,
  name: 'idbReadRepetitiveFromLargeDatabase',
  label: 'idb read 100x1KB by sending get requests in parallel. Values are repetitive. Database size is large.',
  prep: () => prep(100000, generateString(1)),
  benchmark: () => benchmarkReadParallelGet(100),
}

const readLargeRepetitiveFromMediumDatabase: PerformanceTestCase = {
  ...baseCase,
  name: 'idbReadLargeRepetitiveFromMediumDatabase',
  label: 'idb read 100x50KB by sending get requests in parallel. Values are repetitive. Database size is medium.',
  prep: () => prep(10000, generateString(50)),
  benchmark: () => benchmarkReadParallelGet(100),
}

const read100x1KBSerialGet: PerformanceTestCase = {
  ...baseCase,
  name: 'idbRead100x1KBSerialGet',
  label: 'idb read 100x1KB by sending get requests one by one',
  prep: () => prep(100000, generateString(1)),
  benchmark: () => benchmarkReadSerialGet(),
}

const read1000x52KB: PerformanceTestCase = {
  ...baseCase,
  name: 'idbRead100x52KB',
  label: 'idb read 1000x52KB',
  prep: () => prep(1000, generateString(52)),
  benchmark: () => benchmarkReadParallelGet(1000),
}

const cursorBaseCase = {
  ...baseCase,
  benchmark: () => benchmarkReadCursor(),
};

const read1024x100BCursor: PerformanceTestCase = {
  ...cursorBaseCase,
  name: 'idbRead1024x100BCursor',
  label: 'idb read 1024x100B with cursor',
  prep: () => prep(1024, generateString(100 / 1024)),
};

const read100x1KBCursor: PerformanceTestCase = {
  ...cursorBaseCase,
  name: 'idbRead100x1KBCursor',
  label: 'idb read 100x1KB with cursor',
  prep: () => prep(100, generateString(1)),
};

export const idbReadTestCases = [
  read1MB,
  read1KB,
  read1024x100BGetAll,
  read100x1KBGetAll,
  read100x1KBParallelGet,
  read100x1KBSerialGet,
  read1000x52KB,
  read1024x100BCursor,
  read100x1KBCursor,
  readJSON,
  readFromLargeDatabase,
  readRepetitiveFromLargeDatabase,
  readLargeRepetitiveFromMediumDatabase,
];
