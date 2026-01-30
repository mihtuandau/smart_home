import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from './dto/automation.dto';

@Injectable()
export class AutomationService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.automationRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    return this.prisma.automationRule.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(`Automation rule with ID ${id} not found`);
    }

    return rule;
  }

  async create(dto: CreateAutomationRuleDto) {
    return this.prisma.automationRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        conditionType: dto.conditionType,
        conditions: dto.conditions,
        actions: dto.actions,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateAutomationRuleDto) {
    await this.findOne(id); // Verify exists

    return this.prisma.automationRule.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id); // Verify exists

    return this.prisma.automationRule.delete({
      where: { id },
    });
  }

  async toggle(id: string) {
    const rule = await this.findOne(id);

    return this.prisma.automationRule.update({
      where: { id },
      data: {
        isActive: !rule.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async trigger(id: string) {
    const rule = await this.findOne(id);

    // Update last triggered timestamp
    await this.prisma.automationRule.update({
      where: { id },
      data: {
        lastTriggered: new Date(),
      },
    });

    return {
      rule,
      triggered: true,
      timestamp: new Date(),
    };
  }
}
