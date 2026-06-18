import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({
    summary: 'Root liveness probe',
    description:
      'Returns a static hello string. Public — does not require authentication (used by health checks and load balancers).',
  })
  @ApiResponse({ status: 200, description: 'Service is up.' })
  getHello(): string {
    return this.appService.getHello();
  }
}
