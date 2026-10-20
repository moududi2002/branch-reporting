// apps/api/src/workflow/workflow.controller.ts
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('reports')
export class WorkflowController {
  constructor(private readonly wf: WorkflowService) {}

  @Roles('THANA_ADMIN', 'SUPER_ADMIN')
  @Post(':id/submit')
  submit(@Param('id') id: string, @Req() req: any, @Body() body: { comment?: string }) {
    return this.wf.submit(id, req.user, body?.comment);
  }

  @Roles('BRANCH_ADMIN', 'SUPER_ADMIN')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: any, @Body() body: { comment?: string }) {
    return this.wf.approve(id, req.user, body?.comment);
  }

  @Roles('BRANCH_ADMIN', 'SUPER_ADMIN')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Req() req: any, @Body() body: { comment: string }) {
    return this.wf.reject(id, req.user, body?.comment);
  }

  @Roles('BRANCH_ADMIN', 'SUPER_ADMIN')
  @Post(':id/request-revision')
  requestRevision(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.wf.requestRevision(id, req.user, body);
  }

  @Roles('THANA_ADMIN', 'SUPER_ADMIN')
  @Post(':id/resubmit')
  resubmit(@Param('id') id: string, @Req() req: any, @Body() body: { comment?: string }) {
    return this.wf.resubmit(id, req.user, body?.comment);
  }

  @Roles('BRANCH_ADMIN', 'SUPER_ADMIN')
  @Post(':id/new-version')
  newVersion(@Param('id') id: string, @Req() req: any) {
    return this.wf.createNewVersion(id, req.user);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get(':id/history')
  history(@Param('id') id: string) {
    return this.wf.history(id);
  }
}