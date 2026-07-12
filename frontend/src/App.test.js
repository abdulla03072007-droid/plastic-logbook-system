/**
 * Frontend - App.test.js
 * Tests the root App component routing behaviour.
 * Replaces the default CRA boilerplate test that looked for "learn react".
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Smoke test: App module loads without crashing ──────────────────────────

// Mock all pages so the test doesn't need real API calls or complex deps
jest.mock('./pages/Login',              () => () => <div>Login Page</div>);
jest.mock('./pages/Register',           () => () => <div>Register Page</div>);
jest.mock('./pages/Dashboard',          () => () => <div>Dashboard Page</div>);
jest.mock('./pages/Products',           () => () => <div>Products Page</div>);
jest.mock('./pages/Customers',          () => () => <div>Customers Page</div>);
jest.mock('./pages/Payments',           () => () => <div>Payments Page</div>);
jest.mock('./pages/Reports',            () => () => <div>Reports Page</div>);
jest.mock('./pages/Purchases',          () => () => <div>Purchases Page</div>);
jest.mock('./pages/SuperAdminDashboard',() => () => <div>SuperAdmin Page</div>);
jest.mock('./pages/Profile',            () => () => <div>Profile Page</div>);
jest.mock('./components/ProtectedRoute',() => ({ children }) => <div>{children}</div>);

import App from './App';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('App - Routing', () => {

  test('renders Login page at root "/" route', () => {
    render(<App />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders Dashboard page at "/dashboard" route', () => {
    // Wrap with MemoryRouter to control the initial path
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  test('renders Products page at "/products" route', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Products Page')).toBeInTheDocument();
  });

  test('renders Customers page at "/customers" route', () => {
    render(
      <MemoryRouter initialEntries={['/customers']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Customers Page')).toBeInTheDocument();
  });

  test('redirects unknown routes to Login "/" page', () => {
    render(
      <MemoryRouter initialEntries={['/this-does-not-exist']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

});
