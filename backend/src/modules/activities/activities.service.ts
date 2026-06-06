import { ActivitiesRepository, ActivityLogCreateInput, DbActivityLog } from './activities.repository';
import { getIO } from '../../websocket/socket.server';
import { logger } from '../../lib/logger';

export class ActivitiesService {
  constructor(private readonly activitiesRepository: ActivitiesRepository) {}

  async log(data: ActivityLogCreateInput): Promise<DbActivityLog> {
    const log = await this.activitiesRepository.create(data);
    try {
      const io = getIO();
      io.to(`org:${data.organizationId}`).emit('activity_created', log);
    } catch (err) {
      logger.error({ err }, 'Failed to emit activity_created socket event');
    }
    return log;
  }

  async list(organizationId: string, limit = 50): Promise<DbActivityLog[]> {
    return this.activitiesRepository.listActivities(organizationId, limit);
  }
}

const activitiesRepository = new ActivitiesRepository();
export const activitiesService = new ActivitiesService(activitiesRepository);
