import { describe, expect, it, beforeEach } from '@jest/globals';
import { StockService } from '../services/stock.service.js';
import { prisma, redis } from './setup.js';

describe('StockService', () => {
    const mockDate = '2026-03-02';
    const formattedDate = new Date(mockDate).toISOString();

    describe('getStockQty', () => {
        it('should return available stock quantity', async () => {
            // Mock prisma count to return 5
            (prisma.stock.count as jest.Mock).mockResolvedValue(5);

            const result = await StockService.getStockQty(formattedDate);

            expect(result).toBe(5);
            expect(prisma.stock.count).toHaveBeenCalledWith({
                where: {
                    forDate: formattedDate,
                    status: 'AVAILABLE'
                }
            });
            expect(redis.set).toHaveBeenCalled();
        });

        it('should return 0 when no stock available', async () => {
            (prisma.stock.count as jest.Mock).mockResolvedValue(0);

            const result = await StockService.getStockQty(formattedDate);

            expect(result).toBe(0);
            expect(redis.set).not.toHaveBeenCalled();
        });
    });

    describe('reserveStock', () => {
        it('should reserve available stock', async () => {
            const mockStock = { id: 'stock-123' };

            // Mock transaction
            const mockTx = {
                stock: {
                    findFirst: jest.fn().mockResolvedValue(mockStock),
                    update: jest.fn().mockResolvedValue({ ...mockStock, status: 'RESERVED' })
                }
            };
            (prisma.$transaction as jest.Mock).mockImplementation(
                async (callback) => callback(mockTx)
            );

            const result = await StockService.reserveStock(formattedDate);

            expect(result).toBe('stock-123');
            expect(mockTx.stock.findFirst).toHaveBeenCalledWith({
                where: {
                    forDate: formattedDate,
                    status: 'AVAILABLE'
                },
                orderBy: { createdAt: 'asc' }
            });
            expect(mockTx.stock.update).toHaveBeenCalledWith({
                where: { id: 'stock-123' },
                data: { status: 'RESERVED' }
            });
        });

        it('should throw OUT_OF_STOCK when no stock available', async () => {
            const mockTx = {
                stock: {
                    findFirst: jest.fn().mockResolvedValue(null)
                }
            };
            (prisma.$transaction as jest.Mock).mockImplementation(
                async (callback) => callback(mockTx)
            );

            await expect(StockService.reserveStock(formattedDate))
                .rejects.toThrow('OUT_OF_STOCK');
        });
    });

    describe('useStock', () => {
        it('should mark stock as USED', async () => {
            const mockStock = { id: 'stock-123', status: 'RESERVED' };
            (prisma.stock.update as jest.Mock).mockResolvedValue(mockStock);

            const result = await StockService.useStock('stock-123');

            expect(result).toEqual(mockStock);
            expect(prisma.stock.update).toHaveBeenCalledWith({
                where: { id: 'stock-123' },
                data: { status: 'USED' }
            });
        });
    });

    describe('releaseStock', () => {
        it('should mark stock as AVAILABLE', async () => {
            const mockStock = { id: 'stock-123', status: 'AVAILABLE' };
            (prisma.stock.update as jest.Mock).mockResolvedValue(mockStock);

            const result = await StockService.releaseStock('stock-123');

            expect(result).toEqual(mockStock);
            expect(prisma.stock.update).toHaveBeenCalledWith({
                where: { id: 'stock-123' },
                data: { status: 'AVAILABLE' }
            });
        });
    });
});