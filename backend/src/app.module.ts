import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MembersModule } from './modules/members/members.module';
import { RolesModule } from './modules/roles/roles.module';
import { TeamsModule } from './modules/teams/teams.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    MembersModule,
    RolesModule,
    TeamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
