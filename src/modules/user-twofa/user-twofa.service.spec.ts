import { Test, TestingModule } from '@nestjs/testing';
import { UserTwoFaService } from './user-twofa.service';

describe('UserTwoFaService', () => {
  let service: UserTwoFaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserTwoFaService],
    }).compile();

    service = module.get<UserTwoFaService>(UserTwoFaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
