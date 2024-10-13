import { AppDataSource } from 'typeorm.config';

import { faker } from '@faker-js/faker';

import { Role } from '@/common/enums';

import { User } from '@/modules/user/entities/user.entity';

export async function seedUsers() {
  const userRepository = AppDataSource.getRepository(User);

  const users: User[] = [];

  const startYear = new Date().getFullYear() - 5;
  const endYear = new Date().getFullYear();

  for (let i = 0; i < 1000; i++) {
    const user = new User();
    user.name = faker.person.fullName();
    user.email = faker.internet.email();
    user.password = faker.internet.password();
    user.isAuthenticated = faker.datatype.boolean();
    user.role = Role.User;

    const randomCreatedAt = faker.date.between({
      from: new Date(`${startYear}-01-01`),
      to: new Date(`${endYear}-12-31`),
    });
    user.createdAt = randomCreatedAt;

    user.updatedAt = faker.date.between({
      from: randomCreatedAt,
      to: new Date(`${endYear}-12-31`),
    });

    users.push(user);
  }

  await userRepository.save(users);
}
