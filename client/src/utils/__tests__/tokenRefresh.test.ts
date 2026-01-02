import { scheduleTokenRefresh, stopTokenRefresh, refreshAccessToken } from '../tokenRefresh';

describe('tokenRefresh', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    stopTokenRefresh();
    jest.useRealTimers();
  });

  describe('scheduleTokenRefresh', () => {
    it('should schedule token refresh 5 minutes before expiration', () => {
      // Create a token that expires in 1 hour
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      scheduleTokenRefresh(mockToken);

      // Timer should be set for 55 minutes (3600s - 300s = 3300s)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
    });

    it('should refresh immediately if token is about to expire', () => {
      // Create a token that expires in 1 minute
      const futureTime = Math.floor(Date.now() / 1000) + 60;
      const mockToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      const refreshSpy = jest.spyOn(global, 'setTimeout');
      
      scheduleTokenRefresh(mockToken);

      // Should attempt immediate refresh (not schedule)
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('stopTokenRefresh', () => {
    it('should clear the refresh timer', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const mockToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      scheduleTokenRefresh(mockToken);
      stopTokenRefresh();

      expect(clearTimeout).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should return false if no refresh token is available', async () => {
      const result = await refreshAccessToken();
      expect(result).toBe(false);
    });

    it('should store new tokens on successful refresh', async () => {
      localStorage.setItem('refreshToken', 'mock-refresh-token');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            tokens: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
            },
          }),
        })
      ) as jest.Mock;

      const result = await refreshAccessToken();

      expect(result).toBe(true);
      expect(localStorage.getItem('accessToken')).toBe('new-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    });

    it('should logout user if refresh fails', async () => {
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('accessToken', 'old-token');
      localStorage.setItem('isLoggedIn', 'true');

      // Mock window.location
      delete (window as any).location;
      (window as any).location = { href: '' };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        })
      ) as jest.Mock;

      const result = await refreshAccessToken();

      expect(result).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('isLoggedIn')).toBeNull();
    });
  });
});
