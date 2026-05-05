export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  wsUrl: 'http://localhost:8085/ws',
  oauthBaseUrl: 'http://localhost:8081',
  services: {
    auth:     'http://localhost:8080/api/v1',
    workspace:'http://localhost:8080/api/v1',
    board:    'http://localhost:8080/api/v1',
    payment:  'http://localhost:8080/api/v1',
    list:     'http://localhost:8080/api/v1',
    card:     'http://localhost:8080/api/v1',
    comment:  'http://localhost:8080/api/v1',
    label:    'http://localhost:8087/api/v1',
    notification: 'http://localhost:8080/api/v1',
  }
};
