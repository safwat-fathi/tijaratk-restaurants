import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConnectionPool, config as SqlConfig } from 'mssql';

type PosMenuRow = {
  OrderCategory: string | null;
  OrderCode: number;
  OrderName: string;
  OrderPrice: number;
};

type PosDeliveryServiceRow = {
  BranchName: string;
  DeliveryServiceCode: number;
  DeliveryServiceName: string;
  DeliveryServiceAmount: number;
};

/** Handles direct SQL Server access for the Lebanese Bakery POS database. */
@Injectable()
export class PosSqlService implements OnModuleDestroy {
  private pool?: ConnectionPool;

  /** Closes the SQL Server pool on Nest shutdown. */
  async onModuleDestroy(): Promise<void> {
    await this.pool?.close();
  }

  /** Reads menu rows from the POS application orders view. */
  async getMenuRows(): Promise<PosMenuRow[]> {
    const pool = await this.getPool();
    const result = await pool.request().query<PosMenuRow>(`
      SELECT OrderCategory, OrderCode, OrderName, OrderPrice
      FROM dbo.PS_ApplicationOrders_V
    `);
    return result.recordset;
  }

  /** Reads delivery service rows from the POS delivery services view. */
  async getDeliveryServiceRows(): Promise<PosDeliveryServiceRow[]> {
    const pool = await this.getPool();
    const result = await pool.request().query<PosDeliveryServiceRow>(`
      SELECT BranchName, DeliveryServiceCode, DeliveryServiceName, DeliveryServiceAmount
      FROM dbo.PS_ApplicationDeliveryServices_V
    `);
    return result.recordset;
  }

  /** Exports one single-item customer order into POS. */
  async addCustomerOrder(params: {
    customerName: string;
    customerMobile: string;
    customerAddress: string;
    deliveryServiceCode: number;
    orderCode: number;
    orderQty: number;
    orderRemarks: string;
  }): Promise<void> {
    const pool = await this.getPool();
    await pool
      .request()
      .input('CustomerName', params.customerName)
      .input('CustomerMobile', params.customerMobile)
      .input('CustomerAddress', params.customerAddress)
      .input('DeliveryServiceCode', params.deliveryServiceCode)
      .input('OrderCode', params.orderCode)
      .input('OrderQty', params.orderQty)
      .input('OrderRemarks', params.orderRemarks)
      .execute('dbo.PS_AddApplicationCustomerOrder');
  }

  /** Lazily creates a reusable SQL Server connection pool. */
  private async getPool(): Promise<ConnectionPool> {
    if (this.pool?.connected) {
      return this.pool;
    }

    const config: SqlConfig = {
      server: process.env.POS_DB_HOST,
      port: Number(process.env.POS_DB_PORT || 1433),
      user: process.env.POS_DB_USER,
      password: process.env.POS_DB_PASS,
      database: process.env.POS_DB_NAME,
      options: {
        encrypt: process.env.POS_DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.POS_DB_TRUST_CERT !== 'false',
      },
    };

    this.pool = await new ConnectionPool(config).connect();
    return this.pool;
  }
}
