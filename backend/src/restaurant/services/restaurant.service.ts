import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/** Provides public restaurant brand, branch, menu, and delivery read APIs. */
@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns static brand metadata for the storefront. */
  getBrand() {
    return {
      nameAr: 'المخبر اللبناني',
      nameEn: 'The Lebanese Bakery',
    };
  }

  /** Lists active synced branches. */
  findBranches() {
    return this.prisma.branch.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  /** Returns the shared menu grouped by category for a branch. */
  async findMenu(branchId: number) {
    await this.assertBranchExists(branchId);
    return this.prisma.menuCategory.findMany({
      where: { deletedAt: null, items: { some: { isActive: true } } },
      include: {
        items: {
          where: { isActive: true, deletedAt: null },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Lists delivery services available for a branch. */
  async findDeliveryServices(branchId: number) {
    await this.assertBranchExists(branchId);
    return this.prisma.deliveryService.findMany({
      where: { branchId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  /** Throws when a branch is missing or inactive. */
  async assertBranchExists(branchId: number): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!branch) {
      throw new NotFoundException(`Branch ${branchId} not found`);
    }
  }
}
