import { omit } from 'lodash';
import { z } from 'zod';
import prisma, { PrismaTypes } from '../../../../prisma';
import { Metric, CompetitionStatus, CompetitionType } from '../../../../utils';
import { PAGINATION_SCHEMA } from '../../../util/validation';
import { CompetitionListItem } from '../competition.types';

const inputSchema = z
  .object({
    title: z.string().optional(),
    metric: z.nativeEnum(Metric).optional(),
    type: z.nativeEnum(CompetitionType).optional(),
    status: z.nativeEnum(CompetitionStatus).optional()
  })
  .merge(PAGINATION_SCHEMA);

type SearchCompetitionsParams = z.infer<typeof inputSchema>;

async function searchCompetitions(payload: SearchCompetitionsParams): Promise<CompetitionListItem[]> {
  const params = inputSchema.parse(payload);

  const query: PrismaTypes.CompetitionWhereInput = {};

  if (params.type) query.type = params.type;
  if (params.metric) query.metric = params.metric;
  if (params.title) query.title = { contains: params.title, mode: 'insensitive' };

  if (params.status) {
    const now = new Date();

    if (params.status === CompetitionStatus.FINISHED) {
      query.endsAt = { lt: now };
    } else if (params.status === CompetitionStatus.UPCOMING) {
      query.startsAt = { gt: now };
    } else if (params.status === CompetitionStatus.ONGOING) {
      query.startsAt = { lt: now };
      query.endsAt = { gt: now };
    }
  }

  const competitions = await prisma.competition.findMany({
    where: { ...query },
    include: {
      group: {
        include: {
          _count: {
            select: {
              memberships: true
            }
          }
        }
      },
      _count: {
        select: {
          participations: true
        }
      }
    },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    take: params.limit,
    skip: params.offset
  });

  return competitions.map(g => {
    return {
      ...omit(g, ['_count', 'verificationHash']),
      group: g.group
        ? {
            ...omit(g.group, '_count', 'verificationHash'),
            memberCount: g.group._count.memberships
          }
        : undefined,
      participantCount: g._count.participations
    };
  });
}

export { searchCompetitions };
