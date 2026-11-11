import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ProjectReader } from './application/ports/project.reader';
import { ProjectRepository } from './application/ports/project.repository';
import { ProjectQueries } from './application/project.queries';
import { AssignProjectAuthorUseCase } from './application/use-cases/assign-project-author.use-case';
import { ChangeProjectStatusUseCase } from './application/use-cases/change-project-status.use-case';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { DeleteProjectUseCase } from './application/use-cases/delete-project.use-case';
import { UpdateProjectUseCase } from './application/use-cases/update-project.use-case';
import { PrismaProjectReader } from './infrastructure/prisma-project.reader';
import { PrismaProjectRepository } from './infrastructure/prisma-project.repository';
import { ProjectsController } from './presentation/projects.controller';

/** Composition root of the module: binds the application ports to their Prisma adapters. */
@Module({
  imports: [UsersModule],
  controllers: [ProjectsController],
  providers: [
    { provide: ProjectRepository, useClass: PrismaProjectRepository },
    { provide: ProjectReader, useClass: PrismaProjectReader },
    ProjectQueries,
    CreateProjectUseCase,
    UpdateProjectUseCase,
    ChangeProjectStatusUseCase,
    AssignProjectAuthorUseCase,
    DeleteProjectUseCase,
  ],
})
export class ProjectsModule {}
