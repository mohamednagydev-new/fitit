/**
 * Video library import — exercise demos, lesson videos and curated reels from
 * prisma/content/videos.json (exported from the original curated library; all
 * YouTube links, English titles). Matches by exercise name / lesson title, so
 * it composes with the content seeds. Idempotent — re-run any time.
 *   node node_modules/tsx/dist/cli.mjs prisma/seed-videos.ts
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

async function main() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'content', 'videos.json'), 'utf8')) as {
    exercises: { name: string; videoUrl: string | null; videoUrlFemale: string | null }[];
    lessons: { title: string; videoUrl: string }[];
    reels: Record<string, unknown>[];
  };

  let ex = 0;
  for (const e of raw.exercises) {
    const r = await prisma.exercise.updateMany({
      where: { name: e.name },
      data: { videoUrl: e.videoUrl, videoUrlFemale: e.videoUrlFemale },
    });
    ex += r.count;
  }

  let les = 0;
  for (const l of raw.lessons) {
    const r = await prisma.lesson.updateMany({ where: { title: l.title }, data: { videoUrl: l.videoUrl } });
    les += r.count;
  }

  let reels = 0;
  for (const r of raw.reels) {
    const provider = (r.provider as string) ?? 'youtube';
    const externalId = r.externalId as string | null;
    if (externalId) {
      await prisma.curatedReel.upsert({
        where: { provider_externalId: { provider, externalId } },
        update: {},
        create: { ...(r as any), active: true },
      });
      reels++;
    } else if (!(await prisma.curatedReel.findFirst({ where: { title: r.title as string } }))) {
      await prisma.curatedReel.create({ data: { ...(r as any), active: true } });
      reels++;
    }
  }

  console.log(`videos: ${ex} exercise updates, ${les} lesson updates, ${reels} reels in place`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
