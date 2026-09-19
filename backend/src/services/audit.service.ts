import { AuditLog } from '../models/AuditLog';

export class AuditService {
  static async listLogs(
    clinicId: string,
    query: { resource?: string; action?: string; page?: number; limit?: number }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 25;
    const skip = (page - 1) * limit;

    const filter: any = { clinicId };
    if (query.resource) filter.resource = query.resource;
    if (query.action) filter.action = { $regex: query.action, $options: 'i' };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email roleName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter)
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
