import { assertLocalDevelopmentSeedTarget, buildPmDemoSessions } from '../src/development/pm-demo-seed.js';
import { DatabaseClient } from '../src/persistence/client.js';

const DEVELOPMENT_PM = {
  email: 'pm@pairdock.test',
  displayName: 'PairDock PM',
  provider: 'slack',
  providerUserId: 'pairdock-local-pm',
  providerTeamId: 'pairdock-local',
} as const;

async function main(): Promise<void> {
  const target = assertLocalDevelopmentSeedTarget(process.env);
  const database = new DatabaseClient();

  await database.$connect();

  try {
    const projects = await database.project.findMany({ orderBy: { createdAt: 'asc' } });

    if (projects.length === 0) {
      throw new Error('No local project exists. Create a developer project before running the PM demo seed.');
    }

    const pm = await database.user.upsert({
      where: { email_kind: { email: DEVELOPMENT_PM.email, kind: 'pm' } },
      create: {
        email: DEVELOPMENT_PM.email,
        displayName: DEVELOPMENT_PM.displayName,
        kind: 'pm',
      },
      update: { displayName: DEVELOPMENT_PM.displayName },
    });

    await database.externalIdentity.upsert({
      where: {
        provider_providerUserId_providerTeamId: {
          provider: DEVELOPMENT_PM.provider,
          providerUserId: DEVELOPMENT_PM.providerUserId,
          providerTeamId: DEVELOPMENT_PM.providerTeamId,
        },
      },
      create: {
        userId: pm.id,
        provider: DEVELOPMENT_PM.provider,
        providerUserId: DEVELOPMENT_PM.providerUserId,
        providerTeamId: DEVELOPMENT_PM.providerTeamId,
        metadata: { localDevelopment: true, seededDemo: true },
      },
      update: {
        userId: pm.id,
        metadata: { localDevelopment: true, seededDemo: true },
      },
    });

    let sessionCount = 0;

    for (const project of projects) {
      await database.$transaction(async (transaction) => {
        await transaction.projectMember.upsert({
          where: { projectId_userId: { projectId: project.id, userId: pm.id } },
          create: { projectId: project.id, userId: pm.id, role: 'pm' },
          update: { role: 'pm' },
        });

        for (const session of buildPmDemoSessions(project.id, new Date())) {
          await transaction.session.upsert({
            where: { id: session.id },
            create: {
              id: session.id,
              projectId: project.id,
              createdByUserId: pm.id,
              status: session.status,
              modelId: project.defaultModelId,
              reasoningEffort: project.defaultReasoningEffort,
              branchName: session.branchName,
              lastError: session.lastError,
              createdAt: session.createdAt,
              closedAt: session.closedAt,
            },
            update: {
              status: session.status,
              modelId: project.defaultModelId,
              reasoningEffort: project.defaultReasoningEffort,
              branchName: session.branchName,
              lastError: session.lastError,
              createdAt: session.createdAt,
              closedAt: session.closedAt,
            },
          });

          for (const member of [
            { userId: project.ownerUserId, role: 'developer' },
            { userId: pm.id, role: 'pm' },
          ]) {
            await transaction.sessionMember.upsert({
              where: { sessionId_userId: { sessionId: session.id, userId: member.userId } },
              create: { sessionId: session.id, ...member },
              update: { role: member.role },
            });
          }

          for (const message of session.messages) {
            await transaction.message.upsert({
              where: { id: message.id },
              create: {
                ...message,
                sessionId: session.id,
                userId: message.role === 'user' ? pm.id : null,
              },
              update: {
                content: message.content,
                createdAt: message.createdAt,
                role: message.role,
                userId: message.role === 'user' ? pm.id : null,
              },
            });
          }

          if (session.diff) {
            await transaction.agentEvent.upsert({
              where: { id: session.diff.id },
              create: {
                id: session.diff.id,
                sessionId: session.id,
                agentId: project.agentProjectKey,
                type: 'git.diff',
                payload: { diff: session.diff.diff, changedFiles: session.diff.changedFiles },
                createdAt: new Date(session.createdAt.getTime() + 3 * 60_000),
              },
              update: {
                payload: { diff: session.diff.diff, changedFiles: session.diff.changedFiles },
                createdAt: new Date(session.createdAt.getTime() + 3 * 60_000),
              },
            });
          }

          if (session.validation) {
            await transaction.validationRun.upsert({
              where: { id: session.validation.id },
              create: {
                ...session.validation,
                sessionId: session.id,
                logsRef: 'pairdock-pm-demo-seed',
                createdAt: new Date(session.createdAt.getTime() + 4 * 60_000),
              },
              update: {
                status: session.validation.status,
                buildStatus: session.validation.buildStatus,
                testStatus: session.validation.testStatus,
                lintStatus: session.validation.lintStatus,
                previewStatus: session.validation.previewStatus,
                logsRef: 'pairdock-pm-demo-seed',
                createdAt: new Date(session.createdAt.getTime() + 4 * 60_000),
              },
            });
          }

          if (session.reviewRequest) {
            await transaction.pullRequest.upsert({
              where: { id: session.reviewRequest.id },
              create: {
                id: session.reviewRequest.id,
                sessionId: session.id,
                githubPrNumber: session.reviewRequest.number,
                githubPrUrl: session.reviewRequest.url,
                status: session.reviewRequest.status,
                createdAt: new Date(session.createdAt.getTime() + 5 * 60_000),
              },
              update: {
                githubPrNumber: session.reviewRequest.number,
                githubPrUrl: session.reviewRequest.url,
                status: session.reviewRequest.status,
                createdAt: new Date(session.createdAt.getTime() + 5 * 60_000),
              },
            });
          }

          sessionCount += 1;
        }
      });
    }

    console.log(
      `PM demo seed ready in local database "${decodeURIComponent(target.pathname.slice(1))}": ${projects.length} project(s), ${sessionCount} session(s).`,
    );
    console.log('Login with pm@pairdock.test through the local PM development button.');
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
