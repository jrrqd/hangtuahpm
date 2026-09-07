import { PrismaClient, Priority, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { generateKeyBetween } from "../src/lib/fractional-index";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Hangtuah PM…");

  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.label.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const marketing = await prisma.workspace.create({
    data: {
      slug: "marketing",
      name: "Marketing",
      description: "Brand, content, sponsorships & game-day activation",
    },
  });
  const merchandiser = await prisma.workspace.create({
    data: {
      slug: "merchandiser",
      name: "Merchandiser",
      description: "Jerseys, retail drops & FigHTers merch",
    },
  });
  const creative = await prisma.workspace.create({
    data: {
      slug: "creative",
      name: "Creative",
      description: "Design, video & visual storytelling",
    },
  });

  const tempAdmin = "Hangtuah!Admin1";
  const tempLead = "Hangtuah!Lead1";
  const tempStaff = "Hangtuah!Staff1";

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      fullName: "Hangtuah Admin",
      role: Role.ADMIN,
      passwordHash: await hashPassword(tempAdmin),
      mustResetPw: true,
    },
  });

  const lead1 = await prisma.user.create({
    data: {
      username: "lead1",
      fullName: "Leadership One",
      role: Role.LEADERSHIP,
      passwordHash: await hashPassword(tempLead),
      mustResetPw: true,
    },
  });

  const lead2 = await prisma.user.create({
    data: {
      username: "lead2",
      fullName: "Leadership Two",
      role: Role.LEADERSHIP,
      passwordHash: await hashPassword(tempLead),
      mustResetPw: true,
    },
  });

  const staffMarketing = await prisma.user.create({
    data: {
      username: "mkt.staff",
      fullName: "Marketing Staff",
      role: Role.STAFF,
      passwordHash: await hashPassword(tempStaff),
      mustResetPw: true,
      memberships: { create: [{ workspaceId: marketing.id }] },
    },
  });

  const staffMarketing2 = await prisma.user.create({
    data: {
      username: "mkt.staff2",
      fullName: "Marketing Staff 2",
      role: Role.STAFF,
      passwordHash: await hashPassword(tempStaff),
      mustResetPw: true,
      memberships: { create: [{ workspaceId: marketing.id }] },
    },
  });

  const staffMerch = await prisma.user.create({
    data: {
      username: "merch.staff",
      fullName: "Merch Staff",
      role: Role.STAFF,
      passwordHash: await hashPassword(tempStaff),
      mustResetPw: true,
      memberships: { create: [{ workspaceId: merchandiser.id }] },
    },
  });

  const staffCreative = await prisma.user.create({
    data: {
      username: "creative.staff",
      fullName: "Creative Staff",
      role: Role.STAFF,
      passwordHash: await hashPassword(tempStaff),
      mustResetPw: true,
      memberships: { create: [{ workspaceId: creative.id }] },
    },
  });

  void lead1;
  void lead2;
  void staffMarketing2;

  const columnNames = ["To Do", "In Progress", "Review", "Done"];

  const sampleTasks: Record<
    string,
    { title: string; priority: Priority; assigneeId?: string }[]
  > = {
    marketing: [
      {
        title: "RISE STRONGER merch drop Q3",
        priority: Priority.HIGH,
        assigneeId: staffMarketing.id,
      },
      {
        title: "Blibli co-branded jersey mock",
        priority: Priority.URGENT,
        assigneeId: staffMarketing.id,
      },
      {
        title: "Game-night IG carousel",
        priority: Priority.MEDIUM,
        assigneeId: staffMarketing.id,
      },
      {
        title: "Perth Wildcats friendly promo reel",
        priority: Priority.HIGH,
      },
      { title: "TikTok season hype cut", priority: Priority.MEDIUM },
      { title: "Academy jersey approval", priority: Priority.LOW },
    ],
    merchandiser: [
      {
        title: "FigHTers hoodie restock",
        priority: Priority.HIGH,
        assigneeId: staffMerch.id,
      },
      { title: "Precision Gym retail planogram", priority: Priority.MEDIUM },
      {
        title: "City-edition jersey QC",
        priority: Priority.URGENT,
        assigneeId: staffMerch.id,
      },
      { title: "Kids academy kit sizing", priority: Priority.LOW },
      { title: "Partner gift packs MW9", priority: Priority.MEDIUM },
      { title: "Online store banner assets", priority: Priority.MEDIUM },
    ],
    creative: [
      {
        title: "Matchday motion template",
        priority: Priority.HIGH,
        assigneeId: staffCreative.id,
      },
      { title: "Keris crest lockup refresh", priority: Priority.MEDIUM },
      {
        title: "Arena LED bumper pack",
        priority: Priority.URGENT,
        assigneeId: staffCreative.id,
      },
      { title: "Player portrait retouch set", priority: Priority.LOW },
      { title: "Sponsor end-card kit", priority: Priority.MEDIUM },
      { title: "Rise Stronger social covers", priority: Priority.HIGH },
    ],
  };

  for (const ws of [marketing, merchandiser, creative]) {
    const board = await prisma.board.create({
      data: {
        workspaceId: ws.id,
        name: "Sprint Board",
      },
    });

    const columns = [];
    for (let i = 0; i < columnNames.length; i++) {
      columns.push(
        await prisma.column.create({
          data: { boardId: board.id, name: columnNames[i], position: i },
        })
      );
    }

    const tasks = sampleTasks[ws.slug] || [];
    let prev: string | null = null;
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const col = columns[i % 3]; // distribute across To Do / In Progress / Review
      const pos = generateKeyBetween(prev, null);
      prev = pos;
      await prisma.task.create({
        data: {
          columnId: col.id,
          creatorId: admin.id,
          assigneeId: t.assigneeId,
          title: t.title,
          priority: t.priority,
          position: pos,
          description: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: `Sample task for ${ws.name}. Rise Stronger.`,
                  },
                ],
              },
            ],
          }),
        },
      });
    }
  }

  console.log("\n=== Seed complete ===");
  console.log("Admin:        admin /", tempAdmin);
  console.log("Leadership:   lead1 /", tempLead);
  console.log("Staff (mkt):  mkt.staff /", tempStaff);
  console.log("All users mustResetPw=true — change password on first login.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
