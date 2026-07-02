import { Module } from '@nestjs/common';
import { CodebaseService, GitMemberResolverService } from './codebase.service';

@Module({
  providers: [CodebaseService, GitMemberResolverService],
  exports: [CodebaseService, GitMemberResolverService],
})
export class CodebaseModule {}