import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PosSqlService } from './pos-sql.service';

const normalizeName = (value: string): string => value.trim().toLowerCase();

/** Syncs catalog and delivery setup from POS SQL Server into Prisma. */
@Injectable()
export class PosSyncService {
  private readonly logger = new Logger(PosSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly posSqlService: PosSqlService,
  ) {}

  /** Runs all POS sync jobs once. */
  async syncAll(): Promise<{ menuItems: number; deliveryServices: number }> {
    const [menuItems, deliveryServices] = await Promise.all([
      this.syncMenu(),
      this.syncDeliveryServices(),
    ]);

    this.logger.log(
      `POS sync completed: ${menuItems} menu items, ${deliveryServices} delivery services`,
    );

    return { menuItems, deliveryServices };
  }

  /** Syncs shared menu categories and items from POS. */
  async syncMenu(): Promise<number> {
    const run = await this.prisma.syncRun.create({
      data: { entityType: 'menu', status: 'running' },
    });

    try {
      const rows = await this.posSqlService.getMenuRows();
      let upserted = 0;

      for (const row of rows) {
        const categoryName = row.OrderCategory?.trim() || 'Menu';
        const category = await this.prisma.menuCategory.upsert({
          where: { normalizedName: normalizeName(categoryName) },
          update: { name: categoryName, deletedAt: null },
          create: {
            name: categoryName,
            normalizedName: normalizeName(categoryName),
          },
        });

        await this.prisma.menuItem.upsert({
          where: { posOrderCode: Number(row.OrderCode) },
          update: {
            categoryId: category.id,
            name: row.OrderName.trim(),
            price: Number(row.OrderPrice),
            isActive: true,
            deletedAt: null,
          },
          create: {
            categoryId: category.id,
            posOrderCode: Number(row.OrderCode),
            name: row.OrderName.trim(),
            price: Number(row.OrderPrice),
          },
        });
        upserted += 1;
      }

      await this.recordSuccess('menu', run.id, rows.length, upserted);
      return upserted;
    } catch (error) {
      await this.recordFailure('menu', run.id, error);
      throw error;
    }
  }

  /** Syncs branches and branch delivery services from POS. */
  async syncDeliveryServices(): Promise<number> {
    const run = await this.prisma.syncRun.create({
      data: { entityType: 'delivery_services', status: 'running' },
    });

    try {
      const rows = await this.posSqlService.getDeliveryServiceRows();
      let upserted = 0;

      for (const row of rows) {
        const branchName = row.BranchName.trim();
        const branch = await this.prisma.branch.upsert({
          where: { normalizedName: normalizeName(branchName) },
          update: { name: branchName, isActive: true, deletedAt: null },
          create: {
            name: branchName,
            normalizedName: normalizeName(branchName),
          },
        });

        await this.prisma.deliveryService.upsert({
          where: {
            branchId_posDeliveryServiceCode: {
              branchId: branch.id,
              posDeliveryServiceCode: Number(row.DeliveryServiceCode),
            },
          },
          update: {
            name: row.DeliveryServiceName.trim(),
            amount: Number(row.DeliveryServiceAmount),
            isActive: true,
            deletedAt: null,
          },
          create: {
            branchId: branch.id,
            posDeliveryServiceCode: Number(row.DeliveryServiceCode),
            name: row.DeliveryServiceName.trim(),
            amount: Number(row.DeliveryServiceAmount),
          },
        });
        upserted += 1;
      }

      await this.recordSuccess(
        'delivery_services',
        run.id,
        rows.length,
        upserted,
      );
      return upserted;
    } catch (error) {
      await this.recordFailure('delivery_services', run.id, error);
      throw error;
    }
  }

  /** Records a successful sync run and resets failure state. */
  private async recordSuccess(
    entityType: string,
    runId: number,
    rowsRead: number,
    rowsUpserted: number,
  ): Promise<void> {
    await this.prisma.syncRun.update({
      where: { id: runId },
      data: {
        status: 'success',
        rowsRead,
        rowsUpserted,
        finishedAt: new Date(),
      },
    });
    await this.prisma.syncState.upsert({
      where: { entityType },
      update: {
        lastSyncedAt: new Date(),
        consecutiveFailures: 0,
        lastError: null,
      },
      create: { entityType, lastSyncedAt: new Date() },
    });
  }

  /** Records a failed sync run and increments failure state. */
  private async recordFailure(
    entityType: string,
    runId: number,
    error: unknown,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    await this.prisma.syncRun.update({
      where: { id: runId },
      data: { status: 'failed', errorMessage: message, finishedAt: new Date() },
    });
    await this.prisma.syncState.upsert({
      where: { entityType },
      update: {
        consecutiveFailures: { increment: 1 },
        lastError: message,
      },
      create: { entityType, consecutiveFailures: 1, lastError: message },
    });
  }
}
