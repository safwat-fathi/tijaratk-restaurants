import { Module } from '@nestjs/common';
import { PosSqlService } from './pos-sql.service';
import { PosSyncService } from './pos-sync.service';

/** Wires POS SQL Server access and sync services. */
@Module({
  providers: [PosSqlService, PosSyncService],
  exports: [PosSqlService, PosSyncService],
})
export class PosModule {}
