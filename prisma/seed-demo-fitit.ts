/**
 * FIT IT demo world — test users, coaches, buddies, a gym with a live TV board,
 * challenges, lifts/PRs, routines, group sessions. English names, international.
 * Idempotent: upserts + per-user guards, never wipes. Safe on dev and demo envs.
 *   node node_modules/tsx/dist/cli.mjs prisma/seed-demo-fitit.ts
 * Logins: every user below / test1234 · admin@fitit.app / admin123
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const day = (offset: number) => {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0, 10);
};
const at = (daysAgo: number, hour = 18) => {
  const d = new Date(Date.now() - daysAgo * 86400000);
  d.setHours(hour, 0, 0, 0);
  return d;
};

type U = {
  email: string; firstName: string; lastName: string; xp: number; streak: number;
  bio?: string; gender?: string; goalText?: string; quietDays?: number;
};

const USERS: U[] = [
  { email: 'alex@fitit.app', firstName: 'Alex', lastName: 'Rivera', xp: 1240, streak: 9, bio: 'Chasing PRs, one rep at a time.', gender: 'male', goalText: 'Bench 100 kg before summer' },
  { email: 'maya@fitit.app', firstName: 'Maya', lastName: 'Chen', xp: 980, streak: 14, bio: 'Yoga + strength. Balance is everything.', gender: 'female', goalText: 'Hold a 3-minute plank' },
  { email: 'omar@fitit.app', firstName: 'Omar', lastName: 'Hassan', xp: 1710, streak: 21, bio: 'Consistency beats intensity.', gender: 'male' },
  { email: 'sara@fitit.app', firstName: 'Sara', lastName: 'Novak', xp: 640, streak: 5, bio: 'Meal prep queen 🥗', gender: 'female', goalText: 'Lose 6 kg by October' },
  { email: 'liam@fitit.app', firstName: 'Liam', lastName: 'Brooks', xp: 420, streak: 3, bio: 'New here — day 3 and loving it.', gender: 'male' },
  { email: 'nina@fitit.app', firstName: 'Nina', lastName: 'Kowalski', xp: 860, streak: 7, bio: 'Runner learning to lift.', gender: 'female', goalText: 'First 10K under 55 min' },
  { email: 'diego@fitit.app', firstName: 'Diego', lastName: 'Santos', xp: 1530, streak: 12, bio: 'Calisthenics + coffee.', gender: 'male' },
  { email: 'emma.w@fitit.app', firstName: 'Emma', lastName: 'Walsh', xp: 300, streak: 0, bio: 'Getting back on track.', gender: 'female', quietDays: 10 },
  { email: 'tom@fitit.app', firstName: 'Tom', lastName: 'Berger', xp: 210, streak: 1, bio: 'Desk job, big plans.', gender: 'male', quietDays: 8 },
  { email: 'aisha@fitit.app', firstName: 'Aisha', lastName: 'Diallo', xp: 1120, streak: 16, bio: 'Strong is the goal.', gender: 'female' },
];

const COACHES = [
  {
    email: 'coach.jake@fitit.app', firstName: 'Jake', lastName: 'Morrison', gender: 'male',
    headline: 'Strength & hypertrophy — form first', specialties: ['strength', 'muscle'],
    bio: '10 years under the bar. I program simple, brutal, effective strength blocks.',
    invite: 'JAKEFIT7', xp: 2600, streak: 30,
  },
  {
    email: 'coach.emma@fitit.app', firstName: 'Emma', lastName: 'Larsen', gender: 'female',
    headline: 'Mobility, yoga & pain-free training', specialties: ['yoga', 'mobility'],
    bio: 'Physio-informed coaching. Move well before you move heavy.',
    invite: 'EMMAFLOW', xp: 2100, streak: 18,
  },
  {
    email: 'coach.dan@fitit.app', firstName: 'Daniel', lastName: 'Okafor', gender: 'male',
    headline: 'Fat loss without misery', specialties: ['nutrition', 'fatloss'],
    bio: 'Sustainable deficits, big flavors, weekly check-ins that keep you honest.',
    invite: 'DANLEAN1', xp: 1900, streak: 11,
  },
];

async function main() {
  const hash = await bcrypt.hash('test1234', 10);
  const id: Record<string, string> = {};

  // ---- Users ----
  for (const u of USERS) {
    const lastActive = day(-(u.quietDays ?? 0));
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { xp: u.xp, level: 1 + Math.floor(u.xp / 500), currentStreak: u.streak, bio: u.bio, goalText: u.goalText ?? null, goalSharedAt: u.goalText ? new Date() : null },
      create: {
        email: u.email, firstName: u.firstName, lastName: u.lastName, passwordHash: hash,
        xp: u.xp, level: 1 + Math.floor(u.xp / 500), currentStreak: u.streak, longestStreak: u.streak,
        bio: u.bio, gender: u.gender, preferredLang: 'en', onboarded: true,
        lastActiveOn: lastActive, lastSeenAt: at(u.quietDays ?? 0, 12),
        goalText: u.goalText ?? null, goalSharedAt: u.goalText ? new Date() : null,
        weightKg: 60 + Math.round(Math.random() * 30), heightCm: 165 + Math.round(Math.random() * 20),
        fitnessGoal: 'stay_fit', fitnessLevel: 'INTERMEDIATE',
      },
    });
    id[u.email] = user.id;
  }
  console.log(`${USERS.length} users ready (password: test1234)`);

  // ---- Coaches ----
  for (const c of COACHES) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { isCoach: true, coachVerified: true, coachHeadline: c.headline },
      create: {
        email: c.email, firstName: c.firstName, lastName: c.lastName, passwordHash: hash,
        gender: c.gender, preferredLang: 'en', onboarded: true, isCoach: true, coachVerified: true,
        coachHeadline: c.headline, coachBio: c.bio, coachSpecialties: JSON.stringify(c.specialties),
        coachInviteCode: c.invite, xp: c.xp, level: 1 + Math.floor(c.xp / 500),
        currentStreak: c.streak, longestStreak: c.streak, lastActiveOn: day(0), lastSeenAt: new Date(),
      },
    });
    id[c.email] = user.id;
  }
  console.log(`${COACHES.length} verified coaches (invite links: ${COACHES.map((c) => '/invite/' + c.invite).join(', ')})`);

  // ---- Coach workouts + programs ----
  const jake = id['coach.jake@fitit.app'];
  const emma = id['coach.emma@fitit.app'];
  const mkWorkout = async (coachUserId: string, title: string, muscleFocus: string, exercises: { name: string; sets: string; reps: string }[]) => {
    const existing = await prisma.coachWorkout.findFirst({ where: { coachUserId, title } });
    if (existing) return existing.id;
    const w = await prisma.coachWorkout.create({ data: { coachUserId, title, muscleFocus, exercises: JSON.stringify(exercises) } });
    return w.id;
  };
  const wPush = await mkWorkout(jake, 'Push Day Foundations', 'Chest', [
    { name: 'Bench Press', sets: '4 sets', reps: '8 reps' },
    { name: 'Overhead Press', sets: '3 sets', reps: '10 reps' },
    { name: 'Incline Dumbbell Press', sets: '3 sets', reps: '12 reps' },
    { name: 'Triceps Pushdown', sets: '3 sets', reps: '15 reps' },
  ]);
  const wPull = await mkWorkout(jake, 'Pull Day Foundations', 'Back', [
    { name: 'Deadlift', sets: '3 sets', reps: '5 reps' },
    { name: 'Lat Pulldown', sets: '4 sets', reps: '10 reps' },
    { name: 'Seated Row', sets: '3 sets', reps: '12 reps' },
    { name: 'Biceps Curl', sets: '3 sets', reps: '12 reps' },
  ]);
  const wFlow = await mkWorkout(emma, 'Morning Mobility Flow', 'Full body', [
    { name: 'Cat-Cow Stretch', sets: '2 sets', reps: '10 reps' },
    { name: 'World’s Greatest Stretch', sets: '2 sets', reps: '8 reps' },
    { name: 'Deep Squat Hold', sets: '3 sets', reps: '30 reps' },
  ]);
  const mkProgram = async (coachUserId: string, title: string, days: { label: string; workoutId: string }[], visibility = 'public') => {
    const existing = await prisma.coachProgram.findFirst({ where: { coachUserId, title } });
    if (existing) return existing.id;
    const p = await prisma.coachProgram.create({ data: { coachUserId, title, days: JSON.stringify(days), visibility, description: 'Seeded demo program.' } });
    return p.id;
  };
  const progStrong = await mkProgram(jake, 'Starter Strength — 4 Weeks', [
    { label: 'Day 1 — Push', workoutId: wPush },
    { label: 'Day 2 — Pull', workoutId: wPull },
    { label: 'Day 3 — Push', workoutId: wPush },
    { label: 'Day 4 — Pull', workoutId: wPull },
  ]);
  await mkProgram(jake, 'Clients Only — Advanced Block', [
    { label: 'Heavy Push', workoutId: wPush },
    { label: 'Heavy Pull', workoutId: wPull },
  ], 'clients');
  await mkProgram(emma, 'Unstiffen — 2 Week Mobility Reset', [{ label: 'Daily flow', workoutId: wFlow }]);

  // ---- Coach-client relationships + one assigned enrollment ----
  const clients: [string, string][] = [
    ['alex@fitit.app', 'coach.jake@fitit.app'], ['omar@fitit.app', 'coach.jake@fitit.app'],
    ['nina@fitit.app', 'coach.jake@fitit.app'], ['maya@fitit.app', 'coach.emma@fitit.app'],
    ['sara@fitit.app', 'coach.dan@fitit.app'], ['emma.w@fitit.app', 'coach.dan@fitit.app'],
  ];
  for (const [client, coach] of clients) {
    await prisma.coachRequest.upsert({
      where: { clientId_coachUserId: { clientId: id[client], coachUserId: id[coach] } },
      update: { status: 'accepted' },
      create: { clientId: id[client], coachUserId: id[coach], status: 'accepted' },
    });
  }
  await prisma.coachProgramEnrollment.upsert({
    where: { userId_programId: { userId: id['alex@fitit.app'], programId: progStrong } },
    update: {},
    create: { userId: id['alex@fitit.app'], programId: progStrong, completedDays: '[0,1]', assignedBy: jake },
  });

  // ---- Social graph: follows everyone-ish + buddy connections ----
  const everyone = [...USERS.map((u) => u.email), ...COACHES.map((c) => c.email)];
  for (const a of everyone) for (const b of everyone) {
    if (a === b) continue;
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: id[a], followingId: id[b] } },
      update: {}, create: { followerId: id[a], followingId: id[b] },
    });
  }
  const buddies: [string, string][] = [
    ['alex@fitit.app', 'omar@fitit.app'], ['alex@fitit.app', 'maya@fitit.app'],
    ['maya@fitit.app', 'sara@fitit.app'], ['nina@fitit.app', 'diego@fitit.app'],
    ['liam@fitit.app', 'alex@fitit.app'], ['aisha@fitit.app', 'maya@fitit.app'],
  ];
  for (const [a, b] of buddies) {
    await prisma.connection.upsert({
      where: { requesterId_addresseeId: { requesterId: id[a], addresseeId: id[b] } },
      update: { status: 'accepted' }, create: { requesterId: id[a], addresseeId: id[b], status: 'accepted' },
    });
  }

  // ---- Activity invites (walk & talk) ----
  if ((await prisma.activityInvite.count()) === 0) {
    await prisma.activityInvite.create({ data: { fromUserId: id['maya@fitit.app'], toUserId: id['alex@fitit.app'], kind: 'walk', whenText: 'Today 6pm', note: 'Park loop?' } });
    await prisma.activityInvite.create({ data: { fromUserId: id['nina@fitit.app'], toUserId: id['diego@fitit.app'], kind: 'run', whenText: 'Sat morning', status: 'accepted' } });
  }

  // ---- Feed posts + reactions/comments ----
  const POSTS: [string, string, string][] = [
    ['alex@fitit.app', 'completion', 'Crushed Push Day Foundations 🔥 bench felt light today'],
    ['omar@fitit.app', 'levelup', 'Reached level 4! 🎉'],
    ['maya@fitit.app', 'text', 'Morning flow done before sunrise. Best start to the day 🧘'],
    ['nina@fitit.app', 'text', 'First deadlift session ever — hooked already.'],
    ['coach.jake@fitit.app', 'text', 'Form check Friday: send me your squat videos, first 5 get a breakdown 🎥'],
    ['sara@fitit.app', 'text', 'Meal prepped the whole week in 90 minutes. Ask me anything 🥗'],
  ];
  for (const [email, kind, text] of POSTS) {
    const exists = await prisma.feedPost.findFirst({ where: { userId: id[email], text } });
    if (!exists) {
      const post = await prisma.feedPost.create({ data: { userId: id[email], kind, text, createdAt: at(Math.floor(Math.random() * 3), 9 + Math.floor(Math.random() * 9)) } });
      await prisma.postReaction.create({ data: { postId: post.id, userId: id['aisha@fitit.app'], emoji: '💪' } }).catch(() => {});
      await prisma.postReaction.create({ data: { postId: post.id, userId: id['liam@fitit.app'], emoji: '🔥' } }).catch(() => {});
    }
  }
  const jakePost = await prisma.feedPost.findFirst({ where: { userId: jake } });
  if (jakePost && (await prisma.postComment.count({ where: { postId: jakePost.id } })) === 0) {
    await prisma.postComment.create({ data: { postId: jakePost.id, userId: id['alex@fitit.app'], text: 'Sending mine tonight 🙌' } });
  }

  // ---- Weekly XP (leaderboards, leagues, gym board, coach dashboards) ----
  for (const u of USERS) {
    if (u.quietDays) continue;
    const have = await prisma.xpEvent.count({ where: { userId: id[u.email], reason: 'workout-session' } });
    if (have === 0) {
      const sessions = 1 + Math.floor(u.xp / 500);
      for (let i = 0; i < sessions; i++) {
        await prisma.xpEvent.create({ data: { userId: id[u.email], amount: 40 + Math.floor(Math.random() * 40), reason: 'workout-session', createdAt: at(i % 4, 7 + i) } });
      }
    }
  }

  // ---- Lifts: 8 progressive sessions × 3 lifts for four users (PRs + charts) ----
  const LIFTERS = ['alex@fitit.app', 'omar@fitit.app', 'aisha@fitit.app', 'diego@fitit.app'];
  const LIFTS: [string, number][] = [['Bench Press', 60], ['Squat', 80], ['Deadlift', 100]];
  for (const [li, email] of LIFTERS.entries()) {
    const have = await prisma.liftLog.count({ where: { userId: id[email] } });
    if (have > 0) continue;
    for (const [exercise, base] of LIFTS) {
      for (let s = 0; s < 8; s++) {
        const when = at(56 - s * 7, 18);
        const top = base + li * 5 + s * 2.5;
        await prisma.liftLog.create({ data: { userId: id[email], exercise, weightKg: Math.round(top * 0.5), reps: 10, setType: 'warmup', createdAt: when } });
        await prisma.liftLog.create({ data: { userId: id[email], exercise, weightKg: top, reps: 8 - (s % 3), setType: 'normal', createdAt: when } });
        await prisma.liftLog.create({ data: { userId: id[email], exercise, weightKg: Math.round(top * 0.9), reps: 10, setType: 'normal', createdAt: when } });
      }
    }
  }

  // ---- Weights + today's calories for a few users ----
  for (const [email, start] of [['sara@fitit.app', 78], ['alex@fitit.app', 84], ['emma.w@fitit.app', 70]] as [string, number][]) {
    for (let w = 0; w < 6; w++) {
      const date = day(-(35 - w * 7));
      const exists = await prisma.weightLog.findFirst({ where: { userId: id[email], date } });
      if (!exists) await prisma.weightLog.create({ data: { userId: id[email], date, weightKg: start - w * 0.6 } });
    }
  }
  const today = day(0);
  const MEALS: [string, string, string, number, number][] = [
    ['alex@fitit.app', 'breakfast', 'Oatmeal with banana & peanut butter', 420, 18],
    ['alex@fitit.app', 'lunch', 'Grilled chicken rice bowl', 640, 45],
    ['sara@fitit.app', 'breakfast', 'Greek yogurt with berries', 260, 20],
    ['maya@fitit.app', 'lunch', 'Salmon salad', 480, 32],
  ];
  for (const [email, mealType, name, calories, protein] of MEALS) {
    const exists = await prisma.calorieEntry.findFirst({ where: { userId: id[email], date: today, name } });
    if (!exists) await prisma.calorieEntry.create({ data: { userId: id[email], date: today, mealType, name, calories, protein } });
  }

  // ---- Challenges: join the seeded global ones + one friend-group challenge ----
  const globals = await prisma.challenge.findMany({ where: { kind: 'global', endsOn: { gte: today } }, take: 3 });
  for (const ch of globals) {
    for (const email of ['alex@fitit.app', 'maya@fitit.app', 'omar@fitit.app', 'nina@fitit.app', 'aisha@fitit.app']) {
      await prisma.challengeParticipant.upsert({
        where: { challengeId_userId: { challengeId: ch.id, userId: id[email] } },
        update: {},
        create: { challengeId: ch.id, userId: id[email], progress: Math.floor(Math.random() * Math.max(1, ch.goalValue - 1)) },
      });
    }
  }
  let crew = await prisma.challenge.findFirst({ where: { inviteCode: 'FITCREW1' } });
  if (!crew) {
    crew = await prisma.challenge.create({
      data: {
        title: 'Crew of Iron — 20 workouts', goalType: 'lessons', goalValue: 20,
        startsOn: day(-7), endsOn: day(23), kind: 'group', ownerId: id['alex@fitit.app'],
        inviteCode: 'FITCREW1', rewardXp: 150, difficulty: 'medium',
      },
    });
    for (const email of ['alex@fitit.app', 'omar@fitit.app', 'maya@fitit.app', 'diego@fitit.app']) {
      await prisma.challengeParticipant.create({ data: { challengeId: crew.id, userId: id[email], progress: 2 + Math.floor(Math.random() * 6) } });
    }
  }

  // ---- The gym: Iron Temple + members + at-risk + TV board fuel ----
  let gym = await prisma.partner.findFirst({ where: { name: 'Iron Temple Gym' } });
  if (!gym) {
    gym = await prisma.partner.create({
      data: {
        type: 'gym', name: 'Iron Temple Gym', tagline: 'Lift heavy. Belong.',
        description: 'Community strength gym — barbells, coaching, zero ego.',
        city: 'Austin', country: 'US', currency: 'USD', active: true,
        managerUserId: jake, inviteCode: 'IRONTMPL',
        facilities: JSON.stringify(['weights', 'cardio', 'classes', 'showers', 'pt']),
      },
    });
  }
  for (const email of ['alex@fitit.app', 'omar@fitit.app', 'aisha@fitit.app', 'diego@fitit.app', 'nina@fitit.app', 'emma.w@fitit.app', 'tom@fitit.app']) {
    await prisma.user.update({ where: { id: id[email] }, data: { gymId: gym.id, gymJoinedAt: at(20) } });
  }
  // One pending membership request for the approve/decline flow
  await prisma.gymJoinRequest.upsert({
    where: { partnerId_userId: { partnerId: gym.id, userId: id['liam@fitit.app'] } },
    update: { status: 'pending' },
    create: { partnerId: gym.id, userId: id['liam@fitit.app'] },
  });

  // ---- Group session tomorrow ----
  const gs = await prisma.groupSession.findFirst({ where: { coachUserId: jake, title: 'Saturday Strength Social' } });
  if (!gs) {
    const s = await prisma.groupSession.create({
      data: { coachUserId: jake, title: 'Saturday Strength Social', description: 'Push day together — all levels welcome.', muscleFocus: 'Chest', coachWorkoutId: wPush, scheduledAt: at(-2, 18) },
    });
    for (const email of ['alex@fitit.app', 'nina@fitit.app', 'diego@fitit.app']) {
      await prisma.groupParticipant.create({ data: { sessionId: s.id, userId: id[email] } });
    }
  }

  // ---- Public routines (copy flow) ----
  const R = [
    { email: 'alex@fitit.app', title: 'Alex’s 45-min Push', muscleFocus: 'Chest', copies: 4, exercises: [{ name: 'Bench Press', sets: 4, reps: 8, weightKg: 80 }, { name: 'Incline Dumbbell Press', sets: 3, reps: 12, weightKg: 26 }, { name: 'Triceps Pushdown', sets: 3, reps: 15, weightKg: 25 }] },
    { email: 'omar@fitit.app', title: 'Omar’s Leg Builder', muscleFocus: 'Quads', copies: 7, exercises: [{ name: 'Squat', sets: 5, reps: 5, weightKg: 110 }, { name: 'Leg Press', sets: 3, reps: 12, weightKg: 180 }, { name: 'Walking Lunge', sets: 3, reps: 20 }] },
  ];
  for (const r of R) {
    const exists = await prisma.routine.findFirst({ where: { userId: id[r.email], title: r.title } });
    if (!exists) await prisma.routine.create({ data: { userId: id[r.email], title: r.title, muscleFocus: r.muscleFocus, copies: r.copies, exercises: JSON.stringify(r.exercises), isPublic: true } });
  }

  console.log('Demo world ready:');
  console.log('  users: alex/maya/omar/sara/liam/nina/diego/emma.w/tom/aisha @fitit.app — test1234');
  console.log('  coaches: coach.jake / coach.emma / coach.dan @fitit.app — test1234 (verified)');
  console.log('  coach invite links: /invite/JAKEFIT7 /invite/EMMAFLOW /invite/DANLEAN1');
  console.log('  gym: Iron Temple Gym (manager coach.jake) — code IRONTMPL, TV board /tv/' + gym.id);
  console.log('  group challenge code: FITCREW1 · pending gym request from Liam');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
