import { describe, expect, it, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { createOrder, getOrder, deleteOrder } from '../controllers/order.controller.js';
import { OrderService } from '../services/order.service.js';

// Mock OrderService
jest.mock('../src/services/order.service.js');

describe('OrderController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRes = {
            status: mockStatus,
            json: mockJson
        };
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        it('should create order successfully', async () => {
            mockReq = {
                headers: { user_id: 'user-123' }
            };

            const mockOrder = { id: 'order-123', status: 'PENDING' };
            (OrderService.createOrder as jest.Mock).mockResolvedValue(mockOrder);

            await createOrder(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                payload: { order: mockOrder },
                message: 'Order created successfully'
            });
        });

        it('should return 409 for OUT_OF_STOCK error', async () => {
            mockReq = {
                headers: { user_id: 'user-123' }
            };

            const error = new Error('OUT_OF_STOCK');
            (OrderService.createOrder as jest.Mock).mockRejectedValue(error);

            await createOrder(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(409);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'Out of stock'
            });
        });

        it('should return 409 for duplicate order', async () => {
            mockReq = {
                headers: { user_id: 'user-123' }
            };

            const error = { code: 'P2002' };
            (OrderService.createOrder as jest.Mock).mockRejectedValue(error);

            await createOrder(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(409);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'You have already made one order'
            });
        });

        it('should return 400 if userId missing', async () => {
            mockReq = {
                headers: {}
            };

            await createOrder(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
        });
    });

    describe('getOrder', () => {
        it('should return order if found', async () => {
            mockReq = {
                params: { id: 'order-123' }
            };

            const mockOrder = { id: 'order-123' };
            (OrderService.getOrderById as jest.Mock).mockResolvedValue(mockOrder);

            await getOrder(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                payload: { order: mockOrder },
                message: 'Order found'
            });
        });

        it('should return 404 if order not found', async () => {
            mockReq = {
                params: { id: 'order-123' }
            };

            (OrderService.getOrderById as jest.Mock).mockResolvedValue(null);

            await getOrder(mockReq as Request, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(404);
        });
    });
});