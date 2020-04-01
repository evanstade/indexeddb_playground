import {generateString} from 'services/mock_data';
import {PerformanceTestCase} from 'services/performance';

function benchmarkWrite(iteration: number, blob: string) {
  localStorage.clear();
  const start = performance.now();
  for (let i = 0; i < iteration; ++i) {
    localStorage.setItem(`doc_${i}`, blob);
  }
  const end = performance.now();
  localStorage.clear();
  return Promise.resolve(end - start);
}

const write10x100B: PerformanceTestCase = {
  name: 'localStorageWrite10x100B',
  label: 'localStorage write 10x100B',
  description: '',
  benchmark: () => benchmarkWrite(10, generateString(0.1)),
};

const write100x100B: PerformanceTestCase = {
  name: 'localStorageWrite100x100B',
  label: 'localStorage write 100x100B',
  description: '',
  benchmark: () => benchmarkWrite(100, generateString(0.1)),
};

const write1000x100B: PerformanceTestCase = {
  name: 'localStorageWrite1000x100B',
  label: 'localStorage write 1000x100B',
  description: '',
  benchmark: () => benchmarkWrite(1000, generateString(0.1)),
};

const write100x500B: PerformanceTestCase = {
  name: 'localStorageWrite100x500B',
  label: 'localStorage write 100x500B',
  description: '',
  benchmark: () => benchmarkWrite(100, generateString(0.5)),
};

const write100x1KB: PerformanceTestCase = {
  name: 'localStorageWrite100x1KB',
  label: 'localStorage write 100x1KB',
  description: '',
  benchmark: () => benchmarkWrite(100, generateString(1)),
};

const write100x5KB: PerformanceTestCase = {
  name: 'localStorageWrite100x5KB',
  label: 'localStorage write 100x5KB',
  description: '',
  benchmark: () => benchmarkWrite(100, generateString(5)),
};

export const localStorageWriteTestCases = [
  write10x100B,
  write100x100B,
  write1000x100B,
  write100x500B,
  write100x1KB,
  write100x5KB,
];
