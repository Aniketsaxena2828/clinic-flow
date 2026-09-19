import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service';

export class PatientController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PatientService.listPatients(req.clinicId!, req.query as any);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(200).json({
        success: true,
        data: {
          patients: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 1 }
        }
      });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.createPatient(
        req.clinicId!,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(201).json({ success: true, message: 'Patient registered successfully.', data: patient });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to register patient.' });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.getPatientById(req.clinicId!, req.params.id);
      res.status(200).json({ success: true, data: patient });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.updatePatient(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(200).json({ success: true, message: 'Patient profile updated.', data: patient });
    } catch (error) {
      next(error);
    }
  }

  static async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.addDocument(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(200).json({ success: true, message: 'Document attached successfully.', data: patient });
    } catch (error) {
      next(error);
    }
  }

  static async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.archivePatient(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email
      );
      res.status(200).json({ success: true, message: 'Patient archived.', data: patient });
    } catch (error) {
      next(error);
    }
  }
}
