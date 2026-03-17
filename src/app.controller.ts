import { Controller, Get } from '@nestjs/common';
import type { ApiResponse } from './types';

@Controller()
export class AppController {
  @Get()
  getHello(): ApiResponse<{ message: string }> {
    return {
      data: { message: 'Crista Home API' },
      success: true,
    };
  }

  @Get('health')
  health(): ApiResponse<{ status: string }> {
    return {
      data: { status: 'ok' },
      success: true,
    };
  }
}
