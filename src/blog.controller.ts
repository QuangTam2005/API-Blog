import { Controller, Get } from '@nestjs/common';

@Controller()
export class BlogController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'skillswap-blog' };
  }
}
