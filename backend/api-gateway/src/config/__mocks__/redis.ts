// Mock Redis client for testing
export const setCache = jest.fn().mockResolvedValue(true);
export const getCache = jest.fn().mockResolvedValue(null);
export const deleteCache = jest.fn().mockResolvedValue(true);
export const redis = {
  isReady: true,
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
};
export const checkRedisConnection = jest.fn().mockResolvedValue(true);
