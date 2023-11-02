import { Test, TestingModule } from '@nestjs/testing';
import { AttrsService } from './attrs.service';

describe('AttrsService', () => {
  let service: AttrsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttrsService],
    }).compile();

    service = module.get<AttrsService>(AttrsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
