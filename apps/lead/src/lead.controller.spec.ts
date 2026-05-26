import { Test, TestingModule } from '@nestjs/testing';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';

describe('LeadController', () => {
  let leadController: LeadController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LeadController],
      providers: [LeadService],
    }).compile();

    leadController = app.get<LeadController>(LeadController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(leadController.getHello()).toBe('Hello World!');
    });
  });
});
