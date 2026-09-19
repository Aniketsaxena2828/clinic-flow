import { Request, Response, NextFunction } from 'express';
import { Bill, IBill } from '../models/Bill';
import { Appointment } from '../models/Appointment';
import { Patient } from '../models/Patient';
import { Doctor, IDoctor } from '../models/Doctor';
import { PharmacyItem } from '../models/PharmacyItem';

export class AnalyticsController {
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clinicId = req.clinicId;
      if (!clinicId) {
        res.status(401).json({ success: false, message: 'Unauthorized: Clinic context missing from session.' });
        return;
      }

      // Revenue aggregate from settled payments
      const bills = await Bill.find({ clinicId });
      let totalRevenue = 0;
      let pendingReceivables = 0;

      bills.forEach((bill: IBill) => {
        totalRevenue += Number(bill.paidAmount || 0);
        pendingReceivables += Number(bill.balanceDue || 0);
      });

      const totalPatients = await Patient.countDocuments({ clinicId });
      const totalAppointments = await Appointment.countDocuments({ clinicId });
      const lowStockCount = await PharmacyItem.countDocuments({ clinicId, status: { $in: ['Low Stock', 'Out of Stock'] } });

      const doctors = await Doctor.find({ clinicId }).limit(5);
      const topDoctors = (doctors as IDoctor[]).map((d: IDoctor) => ({
        name: d.name,
        specialization: d.specialization,
        consultationFee: d.consultationFee
      }));

      res.status(200).json({
        success: true,
        data: {
          totalRevenue,
          pendingReceivables,
          totalPatients,
          totalAppointments,
          lowStockCount,
          monthlyRevenue: [
            { month: 'Current', revenue: totalRevenue }
          ],
          topDoctors
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
