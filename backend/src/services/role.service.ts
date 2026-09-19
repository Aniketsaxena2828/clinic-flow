import { Role } from '../models/Role';
import { AuditLog } from '../models/AuditLog';

export class RoleService {
  static async listRoles(clinicId: string) {
    const roles = await Role.find({
      $or: [{ clinicId }, { isSystem: true }]
    }).sort({ name: 1 });

    return roles;
  }

  static async createCustomRole(clinicId: string, userId: string, userEmail: string, data: { name: string; description?: string; permissions: string[] }) {
    const existing = await Role.findOne({ clinicId, name: data.name });
    if (existing) {
      throw { statusCode: 400, message: 'A custom role with this name already exists in your clinic.' };
    }

    const role = await Role.create({
      clinicId,
      name: data.name,
      description: data.description,
      isSystem: false,
      permissions: data.permissions
    });

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'CUSTOM_ROLE_CREATED',
      resource: 'Role',
      details: { roleName: role.name, permissionsCount: role.permissions.length }
    });

    return role;
  }

  static async updateRolePermissions(clinicId: string, roleId: string, userId: string, userEmail: string, permissions: string[]) {
    const role = await Role.findOne({ _id: roleId, clinicId });
    if (!role) {
      throw { statusCode: 404, message: 'Custom role not found or system default role is read-only.' };
    }

    role.permissions = permissions;
    await role.save();

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'ROLE_PERMISSIONS_UPDATED',
      resource: 'Role',
      details: { roleId: role._id, permissions }
    });

    return role;
  }
}
