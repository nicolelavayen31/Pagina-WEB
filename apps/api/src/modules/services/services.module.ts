import { Module } from '@nestjs/common';
import { ServiceRepository } from './application/ports/service.repository';
import { ServiceQueries } from './application/service.queries';
import { CreateServiceUseCase } from './application/use-cases/create-service.use-case';
import { UpdateServiceUseCase } from './application/use-cases/update-service.use-case';
import { PrismaServiceRepository } from './infrastructure/prisma-service.repository';
import { ServicesController } from './presentation/services.controller';

@Module({
  controllers: [ServicesController],
  providers: [
    { provide: ServiceRepository, useClass: PrismaServiceRepository },
    ServiceQueries,
    CreateServiceUseCase,
    UpdateServiceUseCase,
  ],
  exports: [ServiceQueries],
})
export class ServicesModule {}
