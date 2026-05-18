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

  /** Exports one full customer order into POS. */
  async addCustomerOrder(params: {
    customerName: string;
    customerMobile: string;
    customerAddress: string;
    deliveryServiceCode: number;
    onlineInvoiceCode: number;
    invoiceRemarks: string;
    items: Array<{
      onlineInvoiceId: number;
      orderCode: number;
      quantity: number;
      remarks: string;
    }>;
  }): Promise<void> {
    const pool = await this.getPool();
    const xmlData = this.buildApplicationOrderXml(params.items);

    await pool
      .request()
      .input('CustomerName', params.customerName)
      .input('CustomerMobile', params.customerMobile)
      .input('CustomerAddress', params.customerAddress)
      .input('DeliveryServiceCode', params.deliveryServiceCode)
      .input('OnLineInvoiceCode', params.onlineInvoiceCode)
      .input('InvoiceRemarks', params.invoiceRemarks)
      .input('xmlData', xmlData)
      .execute('dbo.PS_AddApplicationCustomerOrder');
  }

  /** Builds the POS XML payload in memory without creating temporary files. */
  private buildApplicationOrderXml(
    items: Array<{
      onlineInvoiceId: number;
      orderCode: number;
      quantity: number;
      remarks: string;
    }>,
  ): string {
    const rows = items
      .map(
        (item) => `
        <ROW>
          <AO_OnLineInvoiceID>${item.onlineInvoiceId}</AO_OnLineInvoiceID>
          <AO_OrderCode>${item.orderCode}</AO_OrderCode>
          <AO_Qty>${item.quantity}</AO_Qty>
          <AO_Remarks>${this.escapeXml(item.remarks)}</AO_Remarks>
        </ROW>`,
      )
      .join('');

    return `<ROOT>
      <PS_ApplicationOrder>${rows}
      </PS_ApplicationOrder>
    </ROOT>`;
  }

  /** Escapes free-text values before embedding them in XML text nodes. */
  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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
