import { Request, Response, NextFunction } from 'express';
import { Clinic } from '../models/Clinic';

export const enforceTenantIsolation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || !req.clinicId) {
    res.status(401).json({ success: false, message: 'Tenant context missing from session.' });
    return;
  }

  const authenticatedClinicId = req.clinicId.toString();

  // Validate X-Clinic-ID or X-Tenant-ID header if provided
  const headerClinic = (req.headers['x-clinic-id'] || req.headers['x-tenant-id']) as string;
  if (headerClinic) {
    const trimmedHeader = headerClinic.trim();
    if (trimmedHeader !== authenticatedClinicId) {
      // Allow if header is the clinic code belonging to the authenticated clinic
      const clinic = await Clinic.findById(authenticatedClinicId).select('code').catch(() => null);
      if (!clinic || clinic.code?.toLowerCase() !== trimmedHeader.toLowerCase()) {
        res.status(403).json({ success: false, message: 'Forbidden: Cross-tenant data access attempt blocked.' });
        return;
      }
    }
  }

  // Check body for malicious or mismatching clinicId / clinic_id / tenant_id
  if (req.body && typeof req.body === 'object') {
    const bodyCid = req.body.clinicId || req.body.clinic_id || req.body.tenant_id || req.body.tenantId;
    if (bodyCid && bodyCid.toString() !== authenticatedClinicId) {
      res.status(403).json({ success: false, message: 'Forbidden: Cross-tenant data access attempt blocked.' });
      return;
    }
    // Always force authenticated clinicId
    req.body.clinicId = authenticatedClinicId;
    req.body.clinic_id = authenticatedClinicId;
  }

  // Check query params for malicious or mismatching clinicId / clinic_id / tenant_id
  if (req.query && typeof req.query === 'object') {
    const queryCid = req.query.clinicId || req.query.clinic_id || req.query.tenant_id || req.query.tenantId;
    if (queryCid && queryCid.toString() !== authenticatedClinicId) {
      res.status(403).json({ success: false, message: 'Forbidden: Cross-tenant data access attempt blocked.' });
      return;
    }
    // Always force authenticated clinicId
    req.query.clinicId = authenticatedClinicId;
    req.query.clinic_id = authenticatedClinicId;
  }

  req.clinicId = authenticatedClinicId;
  next();
};

