import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto, SignInDto, OnboardingDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async signUp(dto: SignUpDto) {
    // Check if user exists
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
      },
    });

    // Generate JWT token
    const token = await this.signToken(user.id, user.email);

    return {
      message: 'User created successfully',
      token,
    };
  }

  async signIn(dto: SignInDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = await this.signToken(user.id, user.email);

    return {
      message: 'Logged in successfully',
      token,
    };
  }

  async onboarding(userId: string, dto: OnboardingDto) {
    // Create or update user profile
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        skillLevel: dto.skillLevel,
        preferredLanguages: {
          connectOrCreate: dto.preferredLanguages.map((lang) => ({
            where: { name: lang },
            create: { name: lang },
          })),
        },
      },
      create: {
        userId,
        skillLevel: dto.skillLevel,
        preferredLanguages: {
          connectOrCreate: dto.preferredLanguages.map((lang) => ({
            where: { name: lang },
            create: { name: lang },
          })),
        },
      },
    });

    // Create learning goals
    await this.createInitialGoals(userId, dto);

    return {
      message: 'Onboarding completed successfully',
      profile,
    };
  }

  private async signToken(userId: string, email: string) {
    const payload = {
      sub: userId,
      email,
    };

    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });
  }

  private async createInitialGoals(userId: string, dto: OnboardingDto) {
    // Use the first preferred language or default to JavaScript
    const primaryLanguage =
      dto.preferredLanguages.length > 0
        ? dto.preferredLanguages[0]
        : 'JavaScript';

    // Create initial goals
    await Promise.all(
      dto.learningGoals.map((goal) =>
        this.prisma.learningGoal.create({
          data: {
            title: goal,
            userId,
            status: 'NOT_STARTED',
            language: primaryLanguage,
          },
        })
      )
    );
  }
}
