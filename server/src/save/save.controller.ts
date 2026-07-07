import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { UpsertSaveDto } from './dto/upsert-save.dto';
import { SaveService } from './save.service';

interface SaveResponse {
  version: number;
  data: Record<string, unknown>;
  updatedAt: Date;
}

@UseGuards(JwtAccessGuard)
@Controller('save')
export class SaveController {
  constructor(private readonly saveService: SaveService) {}

  @Get()
  async get(@CurrentUser() user: CurrentUserPayload): Promise<SaveResponse | null> {
    const save = await this.saveService.findByUserId(user.userId);
    if (!save) return null;
    return { version: save.version, data: save.data as Record<string, unknown>, updatedAt: save.updatedAt };
  }

  @Put()
  async put(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpsertSaveDto,
  ): Promise<SaveResponse> {
    const save = await this.saveService.upsert(user.userId, dto.version, dto.data);
    return { version: save.version, data: save.data as Record<string, unknown>, updatedAt: save.updatedAt };
  }
}
