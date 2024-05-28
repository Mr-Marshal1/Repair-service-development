import '@testing-library/jest-dom/extend-expect';  // for extended matchers
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// This sets the mock adapter on the default instance
const mock = new MockAdapter(axios);

// Mock any GET request to /get_csrf_token
mock.onGet('http://localhost:8000/get_csrf_token').reply(200, {
  csrfToken: 'dummy-csrf-token'
});