import { Department } from '../models/Department';

export class DepartmentService {
  static async listDepartments(clinicId: string) {
    let deps = await Department.find({ clinicId }).sort({ name: 1 });
    if (deps.length === 0) {
      // Seed default departments if none exist
      deps = await Department.insertMany([
        { clinicId, name: 'General Medicine', code: 'GEN' },
        { clinicId, name: 'Cardiology', code: 'CARD' },
        { clinicId, name: 'Dental Surgery', code: 'DENT' },
        { clinicId, name: 'Pediatrics', code: 'PED' },
        { clinicId, name: 'Dermatology', code: 'DERM' },
        { clinicId, name: 'Physiotherapy', code: 'PHYS' }
      ]) as any;
    }
    return deps;
  }

  static async createDepartment(clinicId: string, data: { name: string; code: string; description?: string }) {
    const existing = await Department.findOne({ clinicId, name: data.name });
    if (existing) {
      throw { statusCode: 400, message: 'Department with this name already exists.' };
    }
    return await Department.create({ clinicId, ...data });
  }
}
