import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';

export class AppointmentController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointments = await AppointmentService.listAppointments(req.clinicId!, req.query as any);
      res.status(200).json({ success: true, data: appointments });
    } catch (error) {
      res.status(200).json({ success: true, data: [] });
    }
  }

  static async book(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.bookAppointment(
        req.clinicId!,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(201).json({ success: true, message: 'Appointment booked.', data: appointment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to book appointment.' });
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.updateStatus(
        req.clinicId!,
        req.params.id,
        req.body.status,
        req.user!.userId,
        req.user!.email
      );
      res.status(200).json({ success: true, message: `Appointment status updated to ${req.body.status}`, data: appointment });
    } catch (error) {
      next(error);
    }
  }

  static async reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.reschedule(
        req.clinicId!,
        req.params.id,
        req.body.date,
        req.body.timeSlot,
        req.user!.userId,
        req.user!.email
      );
      res.status(200).json({ success: true, message: 'Appointment rescheduled.', data: appointment });
    } catch (error) {
      next(error);
    }
  }
}
