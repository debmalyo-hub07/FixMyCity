import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  // Mock global fetch
  global.fetch = jest.fn((url) => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  // Mock global IntersectionObserver for framer-motion compatibility in Jest/JSDOM
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders FixMyCity hero content', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', {
      name: /Report\.\s*Track\.\s*Fix\./i,
    })
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Spotted a pothole, broken streetlight/i)
  ).toBeInTheDocument();
});
