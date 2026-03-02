import { jest } from '@jest/globals';
import { PrismaClient } from '../generated/prisma/client.js';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock external dependencies
jest.mock('../src/utils/prisma.js', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>()
}));

jest.mock('../src/utils/redis.js', () => ({
    redis: {
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn()
    }
}));

jest.mock('../src/utils/mq.js', () => ({
    mq: {
        publish: jest.fn().mockResolvedValue(undefined)
    }
}));

// Import mocked modules
import prisma from '../src/utils/prisma.js';
import { redis } from '../src/utils/redis.js';
import { mq } from '../src/utils/mq.js';

// Reset mocks before each test
beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
});

export { prisma, redis, mq };