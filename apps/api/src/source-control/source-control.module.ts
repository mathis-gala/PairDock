import { Module } from '@nestjs/common';
import { GithubSourceControlAdapter } from './adapters/github/github-source-control.adapter.js';
import { SOURCE_CONTROL_PORT } from './source-control.tokens.js';

@Module({
  providers: [GithubSourceControlAdapter, { provide: SOURCE_CONTROL_PORT, useExisting: GithubSourceControlAdapter }],
  exports: [SOURCE_CONTROL_PORT],
})
export class SourceControlModule {}
