import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AutomationService } from './automation.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from './dto/automation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('automation')
export class AutomationController {
  constructor(private automationService: AutomationService) {}

  @Get()
  async findAll() {
    const rules = await this.automationService.findAll();
    return {
      success: true,
      count: rules.length,
      data: rules,
    };
  }

  @Get('active')
  async findActive() {
    const rules = await this.automationService.findActive();
    return {
      success: true,
      count: rules.length,
      data: rules,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const rule = await this.automationService.findOne(id);
    return {
      success: true,
      data: rule,
    };
  }

  @Post()
  async create(@Body() dto: CreateAutomationRuleDto) {
    const rule = await this.automationService.create(dto);
    return {
      success: true,
      message: 'Automation rule created successfully',
      data: rule,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAutomationRuleDto,
  ) {
    const rule = await this.automationService.update(id, dto);
    return {
      success: true,
      message: 'Automation rule updated successfully',
      data: rule,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.automationService.delete(id);
    return {
      success: true,
      message: 'Automation rule deleted successfully',
    };
  }

  @Post(':id/toggle')
  async toggle(@Param('id') id: string) {
    const rule = await this.automationService.toggle(id);
    return {
      success: true,
      message: `Automation rule ${rule.isActive ? 'activated' : 'deactivated'}`,
      data: rule,
    };
  }

  @Post(':id/trigger')
  async trigger(@Param('id') id: string) {
    const result = await this.automationService.trigger(id);
    return {
      success: true,
      message: 'Automation rule triggered',
      data: result,
    };
  }
}
