import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Get()
  async findAll() {
    const devices = await this.devicesService.findAll();
    return {
      success: true,
      count: devices.length,
      data: devices,
    };
  }

  @Get('stats')
  async getStats() {
    const stats = await this.devicesService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('type/:type')
  async getByType(@Param('type') type: DeviceType) {
    const devices = await this.devicesService.getByType(type);
    return {
      success: true,
      count: devices.length,
      data: devices,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const device = await this.devicesService.findOne(id);
    return {
      success: true,
      data: device,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    const device = await this.devicesService.update(id, dto);
    return {
      success: true,
      message: 'Device updated successfully',
      data: device,
    };
  }

  @Post(':id/toggle')
  async toggle(@Param('id') id: string) {
    const device = await this.devicesService.toggle(id);
    return {
      success: true,
      message: `Device ${device.status === 'ON' ? 'turned on' : 'turned off'}`,
      data: device,
    };
  }

  @Get(':id/history')
  async getHistory(
    @Param('id') id: string,
    @Query('hours', ParseIntPipe) hours: number = 24,
  ) {
    const history = await this.devicesService.getHistory(id, hours);
    return {
      success: true,
      count: history.length,
      period: `${hours}h`,
      data: history,
    };
  }
}
