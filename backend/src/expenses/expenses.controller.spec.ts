import { ForbiddenException } from '@nestjs/common';

jest.mock('./dto/create-expense.dto', () => ({}));

import { ExpensesController } from './expenses.controller';
import type { AuthenticatedRequest } from '../auth/authenticated-request';

describe('ExpensesController shop access', () => {
  const request = { user: { id: 'user-shop-1' } } as AuthenticatedRequest;
  let controller: ExpensesController;
  let expensesService: { createCategory: jest.Mock };
  let supabaseService: { assertShopAccess: jest.Mock };

  beforeEach(() => {
    expensesService = {
      createCategory: jest.fn(),
    };
    supabaseService = {
      assertShopAccess: jest.fn(),
    };
    controller = new ExpensesController(
      expensesService as never,
      supabaseService as never,
    );
  });

  it('rejects creating an expense category in another shop', async () => {
    supabaseService.assertShopAccess.mockRejectedValue(
      new ForbiddenException('Acces refuse a cette boutique'),
    );

    await expect(
      controller.createCategory(request, {
        name: 'Frais shop B',
        shopId: 2,
        isPersonal: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(supabaseService.assertShopAccess).toHaveBeenCalledWith(
      'user-shop-1',
      2,
    );
    expect(expensesService.createCategory).not.toHaveBeenCalled();
  });
});
