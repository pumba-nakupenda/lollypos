import { ForbiddenException } from '@nestjs/common';

jest.mock('./dto/create-sale.dto', () => ({}));
jest.mock('./dto/update-sale.dto', () => ({}));

import { SalesController } from './sales.controller';
import type { AuthenticatedRequest } from '../auth/authenticated-request';

describe('SalesController shop access', () => {
  const request = { user: { id: 'user-shop-1' } } as AuthenticatedRequest;
  let controller: SalesController;
  let salesService: { findAll: jest.Mock };
  let supabaseService: { assertShopAccess: jest.Mock };

  beforeEach(() => {
    salesService = {
      findAll: jest.fn(),
    };
    supabaseService = {
      assertShopAccess: jest.fn(),
    };
    controller = new SalesController(
      salesService as never,
      supabaseService as never,
    );
  });

  it('rejects reading sales from another shop', async () => {
    supabaseService.assertShopAccess.mockRejectedValue(
      new ForbiddenException('Acces refuse a cette boutique'),
    );

    await expect(controller.findAll(request, '2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(supabaseService.assertShopAccess).toHaveBeenCalledWith(
      'user-shop-1',
      2,
    );
    expect(salesService.findAll).not.toHaveBeenCalled();
  });
});
