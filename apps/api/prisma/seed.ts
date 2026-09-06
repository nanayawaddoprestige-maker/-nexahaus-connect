/**
 * Idempotent seed. Always writes: permissions, roles, the role→permission
 * matrix, and organization settings (branding, GHS, categories, health-score
 * config, approval threshold, inspection template, lease-reminder offsets).
 *
 * When SEED_DEMO_DATA=true (never in production — config guards this): a demo
 * company, a demo OWNER and a demo SUPER_ADMIN/PROPERTY_MANAGER, plus 5
 * clearly-fictional properties with units, tenants, leases, rent charges,
 * payments, expenses, maintenance, inspections, documents and health scores.
 *
 * Run: pnpm --filter @nexahaus/api db:seed
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  RoleKey,
  HealthComponentKey,
} from "@nexahaus/types";

const prisma = new PrismaClient();

const ROLE_META: Record<RoleKey, { name: string; description: string }> = {
  SUPER_ADMIN: { name: "Super Administrator", description: "Full platform access and configuration" },
  MANAGING_DIRECTOR: { name: "Managing Director", description: "Company-wide operational and financial visibility" },
  PROPERTY_MANAGER: { name: "Property Manager", description: "Manages assigned clients and properties" },
  FINANCE_OFFICER: { name: "Finance Officer", description: "Rent, payments, expenses, statements, reconciliation" },
  MAINTENANCE_OFFICER: { name: "Maintenance Officer", description: "Maintenance requests, work orders, vendors" },
  INSPECTOR: { name: "Inspector", description: "Assigned property inspections and reports" },
  LEASING_OFFICER: { name: "Leasing Officer", description: "Leasing workflow where licensed" },
  SUPPORT_STAFF: { name: "Support Staff", description: "Limited client and property communication" },
  VENDOR: { name: "Vendor", description: "Assigned work orders only" },
  OWNER: { name: "Property Owner", description: "Own portfolio only" },
  TENANT: { name: "Tenant", description: "Own tenancy information only" },
};

async function seedRbac(): Promise<void> {
  console.error("· permissions & roles");
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      create: { key, group: key.split(":")[0] },
      update: { group: key.split(":")[0] },
    });
  }

  for (const roleKey of Object.values(RoleKey)) {
    const meta = ROLE_META[roleKey];
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      create: { key: roleKey, name: meta.name, description: meta.description, isSystem: true },
      update: { name: meta.name, description: meta.description },
    });

    const wanted = new Set<string>(ROLE_PERMISSIONS[roleKey]);
    const permissions = await prisma.permission.findMany({
      where: { key: { in: [...wanted] } },
      select: { id: true, key: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
}

async function seedSettings(): Promise<void> {
  console.error("· organization settings");
  const settings: Record<string, Prisma.InputJsonValue> = {
    "company.profile": {
      legalName: "NexaHaus Properties & Asset Management Ltd.",
      product: "NexaHaus Connect",
      tagline: "Managing Properties. Maximizing Assets.",
      office: { city: "Accra", country: "GH" },
    },
    "branding.theme": {
      primary: "#0A1F44",
      accent: "#C9A227",
      surface: "#F7F8FA",
    },
    "locale.defaults": { currency: "GHS", locale: "en-GH", timezone: "Africa/Accra" },
    "maintenance.categories": [
      "PLUMBING", "ELECTRICAL", "PAINTING", "CLEANING", "SECURITY", "LANDSCAPING",
      "AIR_CONDITIONING", "PEST_CONTROL", "REPAIRS", "APPLIANCE", "STRUCTURAL", "OTHER",
    ],
    "expense.categories": [
      "PLUMBING", "ELECTRICAL", "PAINTING", "CLEANING", "SECURITY", "LANDSCAPING",
      "AIR_CONDITIONING", "PEST_CONTROL", "REPAIRS", "INSURANCE", "UTILITIES", "OTHER",
    ],
    "approval.thresholds": {
      maintenanceCostMinor: "150000",
      currency: "GHS",
      note: "Maintenance estimates above this require owner approval. Overridable per management agreement.",
    },
    "lease.reminderOffsetsDays": [90, 60, 30, 7],
    "document.expiryReminderOffsetsDays": [60, 30, 7],
    "healthScore.activeConfigVersion": 1,
    "regulatory.features": {
      leasingEnabled: false,
      agencyEnabled: false,
      salesEnabled: false,
      note: "Regulated activities stay disabled until licensing and qualified personnel are confirmed (Act 1047).",
    },
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.organizationSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  await prisma.healthScoreConfig.upsert({
    where: { version: 1 },
    create: {
      version: 1,
      active: true,
      weights: {
        [HealthComponentKey.OCCUPANCY]: 0.2,
        [HealthComponentKey.RENT_COLLECTION]: 0.2,
        [HealthComponentKey.MAINTENANCE]: 0.15,
        [HealthComponentKey.CONDITION]: 0.15,
        [HealthComponentKey.TENANT_SATISFACTION]: 0.1,
        [HealthComponentKey.DOCUMENTATION]: 0.1,
        [HealthComponentKey.SECURITY]: 0.05,
        [HealthComponentKey.FINANCIAL]: 0.05,
      },
    },
    update: {},
  });

  await prisma.leadScoreConfig.upsert({
    where: { version: 1 },
    create: {
      version: 1,
      active: true,
      factors: {
        propertyCount: { weight: 20, bands: [[1, 5], [2, 12], [4, 20]] },
        diaspora: { weight: 15 },
        managementNeed: { weight: 15 },
        assessmentCompleted: { weight: 20 },
        consultationBooked: { weight: 20 },
        engagement: { weight: 10 },
        grades: { A: 75, B: 55, C: 35, D: 0 },
      },
    },
    update: {},
  });
}

async function seedInspectionTemplate(): Promise<void> {
  console.error("· inspection template");
  const existing = await prisma.inspectionTemplate.findFirst({
    where: { name: "Standard Residential", version: 1 },
  });
  if (existing) return;
  const areas: Record<string, string[]> = {
    LIVING_ROOM: ["Walls & ceiling", "Flooring", "Windows & blinds", "Lighting & sockets"],
    KITCHEN: ["Cabinets & counters", "Sink & taps", "Appliances", "Ventilation"],
    MASTER_BEDROOM: ["Walls & ceiling", "Flooring", "Wardrobe", "AC unit"],
    BATHROOMS: ["Fixtures & fittings", "Water pressure", "Drainage", "Tiling & sealant"],
    EXTERIOR: ["Walls & paint", "Gutters & drainage", "Gate & fencing", "Landscaping"],
    ROOF: ["Covering condition", "Leaks & staining"],
    ELECTRICAL: ["Distribution board", "Earthing", "Visible wiring"],
    PLUMBING: ["Supply lines", "Water storage", "Pump & pressure"],
    SECURITY: ["Locks & doors", "Alarm / CCTV", "Perimeter lighting"],
  };
  await prisma.inspectionTemplate.create({
    data: {
      name: "Standard Residential",
      version: 1,
      isActive: true,
      areas: {
        create: Object.entries(areas).map(([name, items], i) => ({
          name,
          sortOrder: i,
          items: { create: items.map((label, j) => ({ label, sortOrder: j })) },
        })),
      },
    },
  });
}

async function upsertUser(
  email: string,
  fullName: string,
  passwordHash: string,
  roleKeys: RoleKey[],
): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      fullName,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
    update: { fullName, status: "ACTIVE" },
    select: { id: true },
  });
  const roles = await prisma.role.findMany({
    where: { key: { in: roleKeys } },
    select: { id: true },
  });
  for (const role of roles) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
  }
  return user.id;
}

async function nextRef(kind: string, prefix: string): Promise<string> {
  const key = `ref:${kind}`;
  const row = await prisma.sequence.upsert({
    where: { key },
    create: { key, nextValue: 2n },
    update: { nextValue: { increment: 1n } },
    select: { nextValue: true },
  });
  return `${prefix}-${(row.nextValue - 1n).toString().padStart(6, "0")}`;
}

const GHS = "GHS";
const cedis = (amount: number): bigint => BigInt(Math.round(amount * 100));

async function seedDemo(): Promise<void> {
  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!password) {
    console.error("! SEED_DEMO_DATA is on but DEMO_ACCOUNT_PASSWORD is empty — skipping demo data");
    return;
  }
  console.error("· demo data");
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const adminId = await upsertUser(
    process.env.DEMO_ADMIN_EMAIL ?? "admin.demo@nexahaus.example",
    "Ama Boateng (Demo Admin)",
    passwordHash,
    [RoleKey.SUPER_ADMIN, RoleKey.PROPERTY_MANAGER],
  );
  const ownerUserId = await upsertUser(
    process.env.DEMO_OWNER_EMAIL ?? "owner.demo@nexahaus.example",
    "Kwesi Mensah (Demo Owner)",
    passwordHash,
    [RoleKey.OWNER],
  );

  const existingClient = await prisma.client.findFirst({
    where: { primaryEmail: process.env.DEMO_OWNER_EMAIL ?? "owner.demo@nexahaus.example" },
  });
  if (existingClient) {
    console.error("  demo client already present — skipping property generation");
    return;
  }

  const client = await prisma.client.create({
    data: {
      ref: await nextRef("client", "CL"),
      type: "INDIVIDUAL",
      displayName: "Kwesi Mensah",
      segment: "DIASPORA",
      status: "ACTIVE",
      primaryEmail: process.env.DEMO_OWNER_EMAIL ?? "owner.demo@nexahaus.example",
      primaryPhone: "+233201234567",
      countryOfResidence: "GB",
      servicePackage: "PREMIUM",
      accountManagerId: adminId,
      users: {
        create: {
          userId: ownerUserId,
          relationship: "PRIMARY",
          canApprove: true,
          acceptedAt: new Date(),
        },
      },
      onboarding: {
        create: { currentStep: 10, status: "COMPLETE", kycStatus: "VERIFIED", completedAt: new Date() },
      },
    },
  });

  const blueprint = [
    { name: "Cantonments Apartment", type: "APARTMENT", city: "Accra", region: "Greater Accra", units: 4, rent: 8000, status: "OCCUPIED", occupiedUnits: 4, health: 91 },
    { name: "East Legon Townhouse", type: "HOUSE", city: "Accra", region: "Greater Accra", units: 1, rent: 12000, status: "OCCUPIED", occupiedUnits: 1, health: 87 },
    { name: "Airport Residential Flat", type: "APARTMENT", city: "Accra", region: "Greater Accra", units: 2, rent: 6500, status: "OCCUPIED", occupiedUnits: 1, health: 78 },
    { name: "Osu Retail Unit", type: "RETAIL", city: "Accra", region: "Greater Accra", units: 1, rent: 9500, status: "VACANT", occupiedUnits: 0, health: 64 },
    { name: "Spintex Warehouse", type: "WAREHOUSE", city: "Accra", region: "Greater Accra", units: 1, rent: 15000, status: "OCCUPIED", occupiedUnits: 1, health: 83 },
  ] as const;

  for (const bp of blueprint) {
    const property = await prisma.property.create({
      data: {
        ref: await nextRef("property", "NH"),
        clientId: client.id,
        name: bp.name,
        type: bp.type,
        status: bp.status,
        addressLine: `${bp.name}, ${bp.city}`,
        city: bp.city,
        region: bp.region,
        country: "GH",
        unitCount: bp.units,
        estimatedValueMinor: cedis(bp.rent * 220),
        estimatedValueCurrency: GHS,
        onboardingComplete: true,
        owners: { create: { clientId: client.id, sharePercent: 100, isPrimary: true } },
        agreements: {
          create: {
            feeType: "PERCENT_OF_COLLECTED",
            feePercent: bp.type === "RETAIL" || bp.type === "WAREHOUSE" ? 8 : 10,
            feeCurrency: GHS,
            startDate: new Date("2027-01-01"),
            inspectionFrequency: "QUARTERLY",
            maintenanceApprovalThresholdMinor: cedis(1500),
            thresholdCurrency: GHS,
            status: "ACTIVE",
          },
        },
        assignments: {
          create: {
            userId: adminId,
            role: "PROPERTY_MANAGER",
            startDate: new Date("2027-01-01"),
          },
        },
      },
    });

    for (let u = 1; u <= bp.units; u += 1) {
      const occupied = u <= bp.occupiedUnits;
      const unit = await prisma.unit.create({
        data: {
          propertyId: property.id,
          ref: await nextRef("unit", "NHU"),
          label: bp.units === 1 ? "Whole property" : `Unit ${100 + u}`,
          bedrooms: bp.type === "APARTMENT" ? 2 : bp.type === "HOUSE" ? 4 : null,
          bathrooms: bp.type === "APARTMENT" ? 2 : bp.type === "HOUSE" ? 3 : 1,
          marketRentMinor: cedis(bp.rent),
          marketRentCurrency: GHS,
          status: occupied ? "OCCUPIED" : "VACANT",
        },
      });

      if (!occupied) continue;

      const tenant = await prisma.tenant.create({
        data: {
          ref: await nextRef("tenant", "TN"),
          fullName: `${["Adjoa", "Kojo", "Efua", "Yaw", "Abena"][u % 5]} Test-Tenant`,
          phone: `+23324${String(1000000 + u * 37).slice(0, 7)}`,
          email: `tenant${property.ref}.${u}@nexahaus.example`,
          status: "ACTIVE",
        },
      });
      const lease = await prisma.lease.create({
        data: {
          ref: await nextRef("lease", "LS"),
          propertyId: property.id,
          unitId: unit.id,
          clientId: client.id,
          startDate: new Date("2027-01-01"),
          endDate: new Date("2027-12-31"),
          rentMinor: cedis(bp.rent),
          rentCurrency: GHS,
          frequency: "MONTHLY",
          depositMinor: cedis(bp.rent * 2),
          depositCurrency: GHS,
          noticePeriodDays: 30,
          status: "ACTIVE",
          parties: { create: { tenantId: tenant.id, isPrimary: true } },
        },
      });

      // 6 months of rent charges; most paid, the latest partly/unpaid.
      for (let mIdx = 0; mIdx < 6; mIdx += 1) {
        const periodStart = new Date(Date.UTC(2027, 3 + mIdx, 1));
        const periodEnd = new Date(Date.UTC(2027, 4 + mIdx, 1));
        const amount = cedis(bp.rent);
        const isLatest = mIdx === 5;
        const isSecondLatest = mIdx === 4;
        const paid = isLatest ? 0n : isSecondLatest ? cedis(bp.rent * 0.6) : amount;
        const charge = await prisma.rentCharge.create({
          data: {
            leaseId: lease.id,
            propertyId: property.id,
            unitId: unit.id,
            clientId: client.id,
            periodStart,
            periodEnd,
            dueDate: periodStart,
            amountMinor: amount,
            currency: GHS,
            paidMinor: paid,
            status:
              paid === 0n ? "OVERDUE" : paid < amount ? "PARTIALLY_PAID" : "PAID",
          },
        });
        if (paid > 0n) {
          const payment = await prisma.payment.create({
            data: {
              ref: await nextRef("payment", "PMT"),
              tenantId: tenant.id,
              leaseId: lease.id,
              propertyId: property.id,
              unitId: unit.id,
              clientId: client.id,
              amountMinor: paid,
              currency: GHS,
              receivedAt: new Date(periodStart.getTime() + 3 * 86_400_000),
              method: "MOBILE_MONEY",
              status: "CONFIRMED",
              reconciliationStatus: "RECONCILED",
              idempotencyKey: `seed:${charge.id}`,
            },
          });
          await prisma.paymentAllocation.create({
            data: { paymentId: payment.id, rentChargeId: charge.id, amountMinor: paid },
          });
        }
      }
    }

    // One expense and one maintenance request per property.
    await prisma.expense.create({
      data: {
        ref: await nextRef("expense", "EXP"),
        propertyId: property.id,
        category: "PLUMBING",
        description: "Quarterly plumbing service",
        amountMinor: cedis(450),
        currency: GHS,
        incurredAt: new Date("2027-07-15"),
        status: "PAID",
        approvalStatus: "NOT_REQUIRED",
        paymentStatus: "PAID",
      },
    });
    await prisma.maintenanceRequest.create({
      data: {
        ref: await nextRef("maintenance", "MR"),
        propertyId: property.id,
        reportedByType: "TENANT",
        category: "AIR_CONDITIONING",
        priority: bp.health < 70 ? "HIGH" : "MEDIUM",
        title: "AC not cooling in the main room",
        description: "Tenant reports the split unit runs but does not cool.",
        status: bp.health < 70 ? "AWAITING_APPROVAL" : "SCHEDULED",
        estimatedCostMinor: cedis(1850),
        costCurrency: GHS,
        scheduledFor: new Date("2027-09-12T10:00:00Z"),
        statusHistory: {
          create: [
            { toStatus: "REPORTED" },
            { fromStatus: "REPORTED", toStatus: "ACKNOWLEDGED" },
            { fromStatus: "ACKNOWLEDGED", toStatus: "ASSIGNED" },
          ],
        },
      },
    });

    // Latest inspection + a health score with components.
    await prisma.inspection.create({
      data: {
        ref: await nextRef("inspection", "INS"),
        propertyId: property.id,
        type: "ROUTINE",
        inspectorUserId: adminId,
        status: "REPORT_ISSUED",
        scheduledFor: new Date("2027-09-03T09:00:00Z"),
        startedAt: new Date("2027-09-03T09:10:00Z"),
        completedAt: new Date("2027-09-03T10:05:00Z"),
        reviewedAt: new Date("2027-09-04T08:00:00Z"),
        overallCondition: bp.health >= 85 ? "GOOD" : bp.health >= 70 ? "FAIR" : "POOR",
        items: {
          create: [
            { area: "KITCHEN", label: "Sink & taps", rating: "GOOD", sortOrder: 0 },
            { area: "BATHROOMS", label: "Water pressure", rating: bp.health < 70 ? "ATTENTION_REQUIRED" : "GOOD", sortOrder: 1 },
            { area: "EXTERIOR", label: "Walls & paint", rating: bp.health < 80 ? "ATTENTION_REQUIRED" : "GOOD", sortOrder: 2 },
          ],
        },
      },
    });

    const components = [
      { key: HealthComponentKey.OCCUPANCY, raw: bp.occupiedUnits / bp.units, weight: 0.2 },
      { key: HealthComponentKey.RENT_COLLECTION, raw: 0.9, weight: 0.2 },
      { key: HealthComponentKey.MAINTENANCE, raw: bp.health < 70 ? 0.6 : 0.9, weight: 0.15 },
      { key: HealthComponentKey.CONDITION, raw: bp.health / 100, weight: 0.15 },
      { key: HealthComponentKey.TENANT_SATISFACTION, raw: 0.85, weight: 0.1 },
      { key: HealthComponentKey.DOCUMENTATION, raw: 0.95, weight: 0.1 },
      { key: HealthComponentKey.SECURITY, raw: 0.9, weight: 0.05 },
      { key: HealthComponentKey.FINANCIAL, raw: bp.health / 100, weight: 0.05 },
    ];
    await prisma.propertyHealthScore.create({
      data: {
        propertyId: property.id,
        score: bp.health,
        methodologyVersion: 1,
        components: components.map((c) => ({
          key: c.key,
          value: Math.round(c.raw * 100),
          weight: c.weight,
          weighted: Math.round(c.raw * 100 * c.weight),
        })),
        recommendations:
          bp.health < 75
            ? ["Review rental pricing against market", "Clear the maintenance backlog", "Refresh exterior paint"]
            : [],
        componentRows: {
          create: components.map((c) => ({
            key: c.key,
            rawValue: c.raw,
            weight: c.weight,
            weightedScore: c.raw * 100 * c.weight,
          })),
        },
      },
    });
  }

  console.error(`  created ${blueprint.length} demo properties for client ${client.ref}`);
}

async function main(): Promise<void> {
  console.error("Seeding NexaHaus Connect…");
  await seedRbac();
  await seedSettings();
  await seedInspectionTemplate();

  if (process.env.SEED_DEMO_DATA === "true" && process.env.NODE_ENV !== "production") {
    await seedDemo();
  } else {
    console.error("· demo data skipped (SEED_DEMO_DATA not 'true' or production)");
  }
  console.error("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
