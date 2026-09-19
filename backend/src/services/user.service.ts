import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { AuditLog } from '../models/AuditLog';

export class UserService {
  static async listStaffMembers(
    clinicId: string,
    query: { search?: string; role?: string; status?: string; page?: number; limit?: number }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { clinicId };

    if (query.role) {
      filter.roleName = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -refreshToken')
        .populate('roleId', 'name permissions')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async createStaffMember(clinicId: string, performedByUserId: string, performedByUserEmail: string, data: any) {
    // Check email uniqueness within tenant
    const existing = await User.findOne({ clinicId, email: data.email.toLowerCase() });
    if (existing) {
      throw { statusCode: 400, message: 'A staff member with this email already exists in this clinic.' };
    }

    // Lookup role
    const role = await Role.findOne({
      name: data.roleName,
      $or: [{ clinicId }, { isSystem: true }]
    });

    if (!role) {
      throw { statusCode: 404, message: `Role [${data.roleName}] not found.` };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await User.create({
      clinicId,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      roleId: role._id,
      roleName: data.roleName,
      phone: data.phone,
      status: 'active'
    }, clinicId);

    await AuditLog.create({
      clinicId,
      userId: performedByUserId,
      userEmail: performedByUserEmail,
      action: 'STAFF_MEMBER_CREATED',
      resource: 'User',
      details: { createdUserId: newUser._id, createdUserEmail: newUser.email, role: newUser.roleName }
    }, clinicId);

    const userObj = newUser.toObject() as any;
    delete userObj.passwordHash;
    delete userObj.refreshToken;
    return userObj;
  }

  static async updateStaffMember(clinicId: string, userId: string, performedByUserId: string, performedByUserEmail: string, data: any) {
    const user = await User.findOne({ _id: userId, clinicId });
    if (!user) {
      throw { statusCode: 404, message: 'Staff member not found.' };
    }

    if (data.roleName && data.roleName !== user.roleName) {
      const role = await Role.findOne({
        name: data.roleName,
        $or: [{ clinicId }, { isSystem: true }]
      });
      if (role) {
        user.roleId = role._id as any;
        user.roleName = data.roleName;
      }
    }

    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(data.password, salt);
    }

    await user.save();

    await AuditLog.create({
      clinicId,
      userId: performedByUserId,
      userEmail: performedByUserEmail,
      action: 'STAFF_MEMBER_UPDATED',
      resource: 'User',
      details: { updatedUserId: user._id }
    });

    const userObj = user.toObject() as any;
    delete userObj.passwordHash;
    delete userObj.refreshToken;
    return userObj;
  }

  static async toggleStaffStatus(clinicId: string, userId: string, status: 'active' | 'inactive', performedByUserId: string, performedByUserEmail: string) {
    const user = await User.findOneAndUpdate(
      { _id: userId, clinicId },
      { status },
      { new: true }
    ).select('-passwordHash -refreshToken');

    if (!user) {
      throw { statusCode: 404, message: 'Staff member not found.' };
    }

    await AuditLog.create({
      clinicId,
      userId: performedByUserId,
      userEmail: performedByUserEmail,
      action: `STAFF_STATUS_${status.toUpperCase()}`,
      resource: 'User',
      details: { targetUserId: userId }
    });

    return user;
  }
}
