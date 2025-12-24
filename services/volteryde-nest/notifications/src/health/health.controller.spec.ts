import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check from service', () => {
    const mockHealth = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'volteryde-nest',
      version: '1.0.0',
    };

    jest.spyOn(service, 'check').mockReturnValue(mockHealth);

    const result = controller.check();
    expect(result).toEqual(mockHealth);
    expect(service.check).toHaveBeenCalled();
  });
});
