import { Test, TestingModule } from '@nestjs/testing';
import { AttrsController } from './attrs.controller';

describe('AttrsController', () => {
  let controller: AttrsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttrsController],
    }).compile();

    controller = module.get<AttrsController>(AttrsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
