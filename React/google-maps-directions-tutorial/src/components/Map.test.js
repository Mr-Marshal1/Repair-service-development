import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Map from './Map';
import { useJsApiLoader } from '@react-google-maps/api';
import axios from 'axios';
import Cookies from 'js-cookie';
import * as utils from '../utils';

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getRouteInfo: jest.fn()
}));

jest.mock('@react-google-maps/api', () => ({
  useJsApiLoader: () => { return { isLoaded: true } },
  GoogleMap: (props) => <div data-testid="google-map">{props.children}</div>,
  Marker: () => <div data-testid="marker"></div>,
  Autocomplete: ({ children }) => <div>{children}</div>,
  DirectionsRenderer: () => <div data-testid="directions-renderer"></div>,
}));

const masters = [
  { id: 1, label: 'Master 1', latitude: 49.821371, longitude: 24.020226 },
  { id: 2, label: 'Master 2', latitude: 49.817582, longitude: 24.055347 },
];

global.google = {
  maps: {
    DirectionsService: jest.fn(() => ({
      route: jest.fn((request, callback) => {
        callback({
          routes: [
            { legs: [{ distance: { text: '10 km', value: 10000 }, duration: { text: '1 hour', value: 3600 } }] },
            { legs: [{ distance: { text: '20 km', value: 20000 }, duration: { text: '2 hours', value: 7200 } }] },
          ]
        }, 'OK');
      }),
    })),
  },
};

jest.mock('../utils', () => ({
  getRouteInfo: () => { return { directionResponse: null, distance: { text: '10 km', value: 10000 }, duration: { text: '1 hour', value: 3600 }, markerLabel: 'Master' } }
}));

jest.mock('axios', () => ({
  get: (url) => {
    if (url.includes('status')) {
      return Promise.resolve({ data: { has_inprocess_orders: false } });
    } else if (url.includes('masters')) {
      return Promise.resolve({ data: masters });
    } else if (url.includes('csrf')) {
      return Promise.resolve({ data: { csrfToken: 'mocked-csrf-token' } });
    }
    return Promise.reject(new Error('not found'));
  },
  post: (url, data) => {
    if (url.includes('orders/verification/code')) {
      return Promise.resolve({ data: { success: true } });
    } else if (url.includes('orders/verification')) {
      return Promise.resolve({ data: { status: 200 } });
    }
  }
}));
jest.mock('js-cookie', () => ({
  set: jest.fn(),
}));

describe('Map Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders GoogleMap when loaded', async () => {
    render(<Map />);

    await waitFor(() => {
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });
  });

  test('fetches and displays markers on the map', async () => {
    render(<Map />);

    await waitFor(() => {
      expect(screen.getAllByTestId('marker')).toHaveLength(masters.length);
    });
  });

  test('sets CSRF token from API response', async () => {
    render(<Map />);

    await waitFor(() => {
      expect(Cookies.set).toHaveBeenCalledWith('csrftoken', 'mocked-csrf-token', { path: '/' });
    });
  });

  test('is firstname field changes while entering something', async () => {
    render(<Map />);
    act(() => {
      fireEvent.change(screen.getByTestId('firstName'), { target: { value: 'Marshal' } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('firstName').value === 'Marshal').toBeTruthy();
    });
  });

  test('is phone field changes while entering something', async () => {
    render(<Map />);
    act(() => {
      fireEvent.change(screen.getByTestId('phone'), { target: { value: '+380000000000' } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('phone').value === '+380000000000').toBeTruthy();
    });
  });

  test('checks address input and distance calculation', async () => {
    render(<Map />);

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByTestId('address')).toBeInTheDocument();
      }).then(() => {
        fireEvent.change(screen.getByTestId('address'), { target: { value: 'Lviv' } });
        fireEvent.click(screen.getByTestId('rozrahunok'));
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('distance')).toBeInTheDocument();
    });
  });

  test('checks the whole form to ensure it is ready to submit once all necessary fields are filled', async () => {
    render(<Map />);

    await act(async () => {
      await waitFor(() => {
        expect(screen.getByTestId('address')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('address'), { target: { value: 'Lviv' } });
      fireEvent.click(screen.getByTestId('rozrahunok'));
      fireEvent.change(screen.getByTestId('firstName'), { target: { value: 'Marshal' } });
      fireEvent.change(screen.getByTestId('phone'), { target: { value: '+380000000000' } });
      fireEvent.click(screen.getByTestId('phone-submit'));
      await waitFor(() => {
        expect(screen.getByTestId('code')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('code'), { target: { value: '1111' } });
      fireEvent.click(screen.getByTestId('code-submit'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('submit')).toHaveClass('default');
    });
  });
});
