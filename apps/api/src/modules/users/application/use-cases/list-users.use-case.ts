import { Injectable } from '@nestjs/common';
import { UserRepository, type UserView } from '../ports/user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(): Promise<UserView[]> {
    return this.users.list();
  }
}
