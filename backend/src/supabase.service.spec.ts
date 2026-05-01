import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

type SupabaseRow = Record<string, unknown> | null;

type QueryResponse = {
  data: SupabaseRow;
  error: Error | null;
};

const queryBuilder = (response: QueryResponse) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue(response),
});

const createAdminClient = (shop: SupabaseRow, profile: SupabaseRow) => {
  const builders = {
    shops: queryBuilder({ data: shop, error: null }),
    profiles: queryBuilder({ data: profile, error: null }),
  };

  return {
    admin: {
      from: jest.fn((table: 'shops' | 'profiles') => builders[table]),
    },
    builders,
  };
};

describe('SupabaseService.assertShopAccess', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  let service: SupabaseService;

  const mockAdminClient = (shop: SupabaseRow, profile: SupabaseRow) => {
    const { admin, builders } = createAdminClient(shop, profile);
    jest.spyOn(service, 'getAdminClient').mockReturnValue(admin as never);
    return { admin, builders };
  };

  beforeEach(() => {
    service = new SupabaseService({ get: jest.fn() } as never);
  });

  it('allows a super admin to access any existing shop', async () => {
    mockAdminClient(
      { id: 3 },
      {
        id: userId,
        shop_id: null,
        shop_ids: [],
        is_super_admin: true,
        is_active: true,
      },
    );

    await expect(service.assertShopAccess(userId, 3)).resolves.toBeUndefined();
  });

  it('allows a shop owner to access their own shop', async () => {
    const { builders } = mockAdminClient(
      { id: 2 },
      {
        id: userId,
        shop_id: 2,
        shop_ids: [],
        is_super_admin: false,
        is_active: true,
      },
    );

    await expect(service.assertShopAccess(userId, 2)).resolves.toBeUndefined();
    expect(builders.shops.eq).toHaveBeenCalledWith('id', 2);
    expect(builders.profiles.eq).toHaveBeenCalledWith('id', userId);
  });

  it('rejects cross-shop access for a regular shop user', async () => {
    mockAdminClient(
      { id: 2 },
      {
        id: userId,
        shop_id: 1,
        shop_ids: [1],
        is_super_admin: false,
        is_active: true,
      },
    );

    await expect(service.assertShopAccess(userId, 2)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects access when the shop does not exist', async () => {
    mockAdminClient(null, {
      id: userId,
      shop_id: 1,
      shop_ids: [1],
      is_super_admin: false,
      is_active: true,
    });

    await expect(service.assertShopAccess(userId, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
