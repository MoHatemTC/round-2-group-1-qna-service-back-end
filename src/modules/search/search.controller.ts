import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service.js';
import { SearchDto } from './dto/search.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @Roles('ADMIN', 'USER')
  @HttpCode(HttpStatus.OK)
  async search(@Body() searchDto: SearchDto) {
    const results = await this.searchService.search(searchDto);
    return {
      success: true,
      query: searchDto.query,
      count: results.length,
      results,
    };
  }
}
