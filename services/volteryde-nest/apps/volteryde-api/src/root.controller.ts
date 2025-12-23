import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { join } from 'path';

@ApiExcludeController()
@Controller()
export class RootController {
  @Get()
  getRoot(@Res() res: Response) {
    // Use absolute path from the working directory
    const publicDir = join(process.cwd(), 'public', 'index.html');
    return res.sendFile(publicDir);
  }
}
