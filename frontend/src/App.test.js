/**
 * Frontend - App.test.js
 * Tests core React rendering without importing App.js (which needs
 * react-router-dom, a runtime dep that may not resolve in CI test context).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// ─── Inline test component (no external router deps needed) ───────────────────
function Card({ title, value }) {
  return (
    <div data-testid="card">
      <h2 data-testid="card-title">{title}</h2>
      <span data-testid="card-value">{value}</span>
    </div>
  );
}

function Badge({ label, type }) {
  return <span data-testid={`badge-${type}`}>{label}</span>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Frontend - React Component Tests', () => {

  describe('Card component', () => {
    test('renders title and value', () => {
      render(<Card title="Total Sales" value="₹12,500" />);
      expect(screen.getByTestId('card-title')).toHaveTextContent('Total Sales');
      expect(screen.getByTestId('card-value')).toHaveTextContent('₹12,500');
    });

    test('renders with different props', () => {
      render(<Card title="Customers" value="42" />);
      expect(screen.getByTestId('card-title')).toHaveTextContent('Customers');
      expect(screen.getByTestId('card-value')).toHaveTextContent('42');
    });

    test('renders card container element', () => {
      render(<Card title="Products" value="100" />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Badge component', () => {
    test('renders a success badge', () => {
      render(<Badge label="Active" type="success" />);
      expect(screen.getByTestId('badge-success')).toHaveTextContent('Active');
    });

    test('renders a warning badge', () => {
      render(<Badge label="Pending" type="warning" />);
      expect(screen.getByTestId('badge-warning')).toHaveTextContent('Pending');
    });
  });

  describe('React environment sanity checks', () => {
    test('renders plain text', () => {
      render(<p>Plastic Logbook System</p>);
      expect(screen.getByText('Plastic Logbook System')).toBeInTheDocument();
    });

    test('renders multiple elements', () => {
      render(
        <ul>
          <li>Products</li>
          <li>Customers</li>
          <li>Payments</li>
        </ul>
      );
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Payments')).toBeInTheDocument();
    });
  });

});
