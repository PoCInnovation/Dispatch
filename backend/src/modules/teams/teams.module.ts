import { Module } from '@nestjs/common';

import { TeamMembersController } from './team-members.controller';
import { TeamMembersService } from './team-members.service';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  controllers: [TeamsController, TeamMembersController],
  providers: [TeamsService, TeamMembersService],
  exports: [TeamsService, TeamMembersService],
})
export class TeamsModule {}
