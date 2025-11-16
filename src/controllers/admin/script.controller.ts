import { Request, Response } from 'express';

import { ServiceError } from '../../services/errors';
import * as scriptService from '../../services/admin/script.service';

export async function listScripts(req: Request, res: Response) {
  const scripts = await scriptService.listScripts();

  res.render('scripts/index', {
    pageTitle: 'Scripts',
    scripts,
    activePage: 'scripts'
  });
}

export function renderCreateForm(req: Request, res: Response) {
  res.render('scripts/create', {
    pageTitle: 'Create Script',
    error: null,
    activePage: 'scripts',
    formData: scriptService.getDefaultScriptFormData()
  });
}

export async function createScript(req: Request, res: Response) {
  try {
    await scriptService.createScript(req.body, req.file);
    return res.redirect('/admin/scripts');
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return res.status(400).render('scripts/create', {
        pageTitle: 'Create Script',
        error: error.message,
        formData: (error.formData as scriptService.ScriptFormData) ?? scriptService.getDefaultScriptFormData(),
        activePage: 'scripts'
      });
    }

    return res.status(400).render('scripts/create', {
      pageTitle: 'Create Script',
      error: 'Failed to create script',
      formData: scriptService.getDefaultScriptFormData({
        name: req.body?.name ?? '',
        scriptUrl: req.body?.scriptUrl ?? '',
        description: req.body?.description ?? ''
      }),
      activePage: 'scripts'
    });
  }
}

export async function renderEditForm(req: Request, res: Response) {
  const { id } = req.params;
  const script = await scriptService.getScriptById(id);

  if (!script) {
    return res.redirect('/admin/scripts');
  }

  return res.render('scripts/edit', {
    pageTitle: `Edit ${script.name}`,
    error: null,
    script,
    activePage: 'scripts'
  });
}

export async function updateScript(req: Request, res: Response) {
  const { id } = req.params;
  const script = await scriptService.getScriptById(id);

  if (!script) {
    return res.redirect('/admin/scripts');
  }

  try {
    await scriptService.updateScript(id, req.body, req.file);
    return res.redirect('/admin/scripts');
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return res.status(400).render('scripts/edit', {
        pageTitle: `Edit ${script.name}`,
        error: error.message,
        script: {
          ...script,
          name: req.body?.name ?? script.name,
          scriptUrl: req.body?.scriptUrl ?? script.scriptUrl,
          description: req.body?.description ?? script.description
        },
        activePage: 'scripts'
      });
    }

    return res.status(400).render('scripts/edit', {
      pageTitle: `Edit ${script.name}`,
      error: 'Failed to update script',
      script: {
        ...script,
        name: req.body?.name ?? script.name,
        scriptUrl: req.body?.scriptUrl ?? script.scriptUrl,
        description: req.body?.description ?? script.description
      },
      activePage: 'scripts'
    });
  }
}

export async function deleteScript(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await scriptService.deleteScript(id);
  } catch (error) {
    // TODO: log error
  }

  return res.redirect('/admin/scripts');
}
