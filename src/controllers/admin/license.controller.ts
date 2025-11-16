import { Request, Response } from 'express';
import { ServiceError } from '../../services/errors';
import * as licenseService from '../../services/admin/license.service';

function normalizeLicenseFormData(data?: Record<string, unknown>) {
  return licenseService.getDefaultLicenseFormData({
    licenseKey: (data?.licenseKey as string) ?? '',
    maxDevices: Number(data?.maxDevices ?? 1),
    status: (data?.status as string) ?? 'active',
    expiryDate: (data?.expiryDate as string) ?? '',
    scriptId: (data?.scriptId as string) ?? ''
  });
}

export function handleGenerateKey(req: Request, res: Response) {
  return res.json({ key: licenseService.generateLicenseKey() });
}

export async function listLicenses(req: Request, res: Response) {
  const licenses = await licenseService.listLicenses();

  res.render('licenses/index', {
    pageTitle: 'Licenses',
    licenses,
    adminUser: req.adminUser,
    activePage: 'licenses'
  });
}

export async function renderCreateForm(req: Request, res: Response) {
  const scripts = await licenseService.getScriptOptions();

  res.render('licenses/create', {
    pageTitle: 'Create License',
    error: null,
    scripts,
    formData: licenseService.getDefaultLicenseFormData(),
    activePage: 'licenses'
  });
}

export async function createLicense(req: Request, res: Response) {
  try {
    await licenseService.createLicense(req.body);
    return res.redirect('/admin/licenses');
  } catch (error: unknown) {
    const scripts = await licenseService.getScriptOptions();

    if (error instanceof ServiceError) {
      return res.status(400).render('licenses/create', {
        pageTitle: 'Create License',
        error: error.message,
        scripts,
        formData: normalizeLicenseFormData(error.formData as Record<string, unknown>),
        activePage: 'licenses'
      });
    }

    return res.status(400).render('licenses/create', {
      pageTitle: 'Create License',
      error: 'Failed to create license',
      scripts,
      formData: normalizeLicenseFormData(req.body),
      activePage: 'licenses'
    });
  }
}

export async function viewLicense(req: Request, res: Response) {
  const { id } = req.params;
  const license = await licenseService.getLicenseDetail(id);

  if (!license) {
    return res.redirect('/admin/licenses');
  }

  res.render('licenses/detail', {
    pageTitle: `License ${license.licenseKey}`,
    license,
    activePage: 'licenses'
  });
}

export async function renderEditForm(req: Request, res: Response) {
  const { id } = req.params;
  const [license, scripts] = await Promise.all([
    licenseService.getLicenseById(id),
    licenseService.getScriptOptions()
  ]);

  if (!license) {
    return res.redirect('/admin/licenses');
  }

  res.render('licenses/edit', {
    pageTitle: `Edit ${license.licenseKey}`,
    error: null,
    license,
    scripts,
    selectedScriptId: license.scriptId,
    activePage: 'licenses'
  });
}

export async function updateLicense(req: Request, res: Response) {
  const { id } = req.params;
  const license = await licenseService.getLicenseById(id);

  if (!license) {
    return res.redirect('/admin/licenses');
  }

  try {
    await licenseService.updateLicense(id, req.body);
    return res.redirect(`/admin/licenses/${id}`);
  } catch (error: unknown) {
    const scripts = await licenseService.getScriptOptions();

    if (error instanceof ServiceError) {
      const formData = normalizeLicenseFormData(error.formData as Record<string, unknown>);

      return res.status(400).render('licenses/edit', {
        pageTitle: `Edit ${license.licenseKey}`,
        error: error.message,
        scripts,
        selectedScriptId: formData.scriptId || license.scriptId,
        license: {
          ...license,
          maxDevices: Number(formData.maxDevices ?? license.maxDevices),
          status: formData.status || license.status,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : license.expiryDate
        },
        activePage: 'licenses'
      });
    }

    return res.status(400).render('licenses/edit', {
      pageTitle: `Edit ${license.licenseKey}`,
      error: 'Failed to update license',
      scripts,
      selectedScriptId: req.body?.scriptId ?? license.scriptId,
      license: {
        ...license,
        maxDevices: Number(req.body?.maxDevices ?? license.maxDevices),
        status: req.body?.status ?? license.status
      },
      activePage: 'licenses'
    });
  }
}

export async function resetBinding(req: Request, res: Response) {
  const { id } = req.params;
  await licenseService.resetBinding(id);
  return res.redirect(`/admin/licenses/${id}`);
}

export async function banLicense(req: Request, res: Response) {
  const { id } = req.params;
  await licenseService.banLicense(id);
  return res.redirect(`/admin/licenses/${id}`);
}

export async function unbanLicense(req: Request, res: Response) {
  const { id } = req.params;
  await licenseService.unbanLicense(id);
  return res.redirect(`/admin/licenses/${id}`);
}

export async function deleteLicense(req: Request, res: Response) {
  const { id } = req.params;
  await licenseService.deleteLicense(id);
  return res.redirect('/admin/licenses');
}
