import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMService } from '../llm/llm.service';

interface DashboardInsights {
  strongPoints: string[];
  skillsToStrengthen: string[];
}

@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService, private llm: LLMService) {}

  private needsRegeneration(lastGeneratedAt?: Date): boolean {
    if (!lastGeneratedAt) return true;
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Date.now() - new Date(lastGeneratedAt).getTime() > oneDayMs;
  }

  async getInsights(userId: string): Promise<DashboardInsights | null> {
    // Gather relevant data: progress, grades, languages, difficulties, recent review summaries
    const [progress, cached] = await Promise.all([
      this.prisma.progress.findMany({
        where: { userId },
        include: {
          exercise: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.dashboardInsight.findUnique({ where: { userId } }),
    ]);

    const hasRelevant = progress.length > 0;
    if (!hasRelevant) {
      return null;
    }

    if (cached && !this.needsRegeneration(cached.generatedAt)) {
      return {
        strongPoints: (cached.strongPoints as unknown as string[]) || [],
        skillsToStrengthen:
          (cached.skillsToStrengthen as unknown as string[]) || [],
      };
    }

    // Build prompt context from recent activity
    const recent = progress.slice(0, 50).map((p) => ({
      status: p.status,
      grade: p.grade ?? null,
      language: p.exercise?.language ?? 'Unknown',
      difficulty: p.exercise?.difficulty ?? 'UNKNOWN',
      title: p.exercise?.title ?? '',
      reviewSummary: p.reviewSummary ?? null,
    }));

    const schema = `{
      "type": "object",
      "required": ["strongPoints", "skillsToStrengthen"],
      "properties": {
        "strongPoints": {
          "type": "array",
          "maxItems": 3,
          "items": { "type": "string" }
        },
        "skillsToStrengthen": {
          "type": "array",
          "maxItems": 3,
          "items": { "type": "string" }
        }
      }
    }`;

    const prompt = `You are generating concise learning insights.
Use the user's recent activity (grades, languages, difficulty, review summaries) to create two lists:
- Strong Points (2-3 bullets)
- Skills to Strengthen (2-3 bullets)
Rules:
- Be brief (max ~10 words per bullet)
- No fluff, no duplicates, no generic platitudes
- Only infer from the provided data

Recent activity JSON:
${JSON.stringify(recent).slice(0, 12000)}
`;

    const result = await this.llm.generateJson<DashboardInsights>(
      prompt,
      schema
    );

    // Normalize to 2-3 items
    const strongPoints = (result.strongPoints || []).slice(0, 3);
    const skillsToStrengthen = (result.skillsToStrengthen || []).slice(0, 3);

    // Upsert cache
    await this.prisma.dashboardInsight.upsert({
      where: { userId },
      update: {
        strongPoints: strongPoints as unknown as any,
        skillsToStrengthen: skillsToStrengthen as unknown as any,
        generatedAt: new Date(),
      },
      create: {
        userId,
        strongPoints: strongPoints as unknown as any,
        skillsToStrengthen: skillsToStrengthen as unknown as any,
      },
    });

    return { strongPoints, skillsToStrengthen };
  }
}
