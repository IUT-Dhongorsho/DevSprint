import { describe, expect, it, beforeEach } from '@jest/globals';
import { OrderService } from '../services/order.service.js';
import { StockService } from '../services/stock.service.js';
import { prisma, mq } from './setup.js';

// Mock StockService
jest.mock('../src/services/stock.service.js');

describe('OrderService', () => {
    const mockUserId = 'user-123';
    const mockDate = '2026-03-02';
    const formattedDate = new Date(mockDate).toISOString();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        it('should create order successfully', async () => {
            const mockStockId = 'stock-123';
            const mockOrder = {
                id: 'order-123',
                user_id: mockUserId,
                stock_id: mockStockId,
                status: 'PENDING',
                forDate: formattedDate
            };

            // Mock stock reservation
            (StockService.reserveStock as jest.Mock).mockResolvedValue(mockStockId);

            // Mock order creation
            (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

            const result = await OrderService.createOrder(mockUserId, formattedDate);

            expect(result).toEqual(mockOrder);
            expect(StockService.reserveStock).toHaveBeenCalledWith(formattedDate);
            expect(prisma.order.create).toHaveBeenCalledWith({
                data: {
                    user_id: mockUserId,
                    stock_id: mockStockId,
                    status: 'PENDING',
                    forDate: formattedDate
                }
            });
            expect(mq.publish).toHaveBeenCalledWith('order.created', {
                userId: mockUserId,
                orderId: 'order-123'
            });
        });

        it('should release stock and throw error if order creation fails', async () => {
            const mockStockId = 'stock-123';
            const dbError = new Error('DB Error');

            (StockService.reserveStock as jest.Mock).mockResolvedValue(mockStockId);
            (prisma.order.create as jest.Mock).mockRejectedValue(dbError);
            (StockService.releaseStock as jest.Mock).mockResolvedValue(undefined);

            await expect(OrderService.createOrder(mockUserId, formattedDate))
                .rejects.toThrow('DB Error');

            expect(StockService.releaseStock).toHaveBeenCalledWith(mockStockId);
            expect(mq.publish).not.toHaveBeenCalled();
        });
    });

    describe('markInKitchen', () => {
        it('should mark order as in kitchen and use stock', async () => {
            const mockOrder = {
                user_id: mockUserId,
                stock_id: 'stock-123'
            };

            (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
            (StockService.useStock as jest.Mock).mockResolvedValue(undefined);

            await OrderService.markInKitchen('order-123');

            expect(StockService.useStock).toHaveBeenCalledWith('stock-123');
            expect(mq.publish).toHaveBeenCalledWith('order.in_kitchen', {
                userId: mockUserId,
                orderId: 'order-123'
            });
        });

        it('should throw ORDER_NOT_FOUND if order does not exist', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(OrderService.markInKitchen('order-123'))
                .rejects.toThrow('ORDER_NOT_FOUND');
        });
    });

    describe('markFailed', () => {
        it('should mark order as failed and release stock', async () => {
            const mockOrder = {
                stock_id: 'stock-123'
            };
            const mockUpdated = {
                user_id: mockUserId
            };

            (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
            (StockService.releaseStock as jest.Mock).mockResolvedValue(undefined);
            (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdated);

            const result = await OrderService.markFailed('order-123', 'Out of stock');

            expect(StockService.releaseStock).toHaveBeenCalledWith('stock-123');
            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 'order-123' },
                data: { status: 'FAILED' },
                select: { user_id: true }
            });
            expect(mq.publish).toHaveBeenCalledWith('order.failed', {
                userId: mockUserId,
                orderId: 'order-123',
                reason: 'Out of stock'
            });
        });
    });
});