import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export interface UpdateProfileDto {
  username?: string;
  email?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prismaService.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prismaService.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    // Generate JWT token
    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { username, email } = dto;

    if (username) {
      const existing = await this.prismaService.user.findFirst({
        where: { username, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Username already taken');
    }

    if (email) {
      const existing = await this.prismaService.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Email already taken');
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: { ...(username && { username }), ...(email && { email }) },
      select: { id: true, email: true, username: true, role: true },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    if (dto.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password changed successfully' };
  }

  private generateToken(user: {
    id: string;
    email: string;
    username: string;
    role: UserRole;
  }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
