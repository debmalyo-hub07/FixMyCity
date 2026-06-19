import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FixMyCity hero content', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', {
      name: /FixMyCity helps citizens report issues and follow every update/i,
    })
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Citizen issue reporting system/i)
  ).toBeInTheDocument();
});
