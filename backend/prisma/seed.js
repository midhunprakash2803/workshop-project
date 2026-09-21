const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.damageReport.deleteMany({});
  await prisma.assetCondition.deleteMany({});
  await prisma.rental.deleteMany({});
  await prisma.rentalRequest.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing records.');

  // Password hashes
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@123', 10);
  const borrowerPasswordHash = await bcrypt.hash('Borrower@123', 10);

  // 1. Create Users
  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Eleanor Vance (Admin)',
      email: 'admin@rentiq.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  // 2 Staff
  const staff1 = await prisma.user.create({
    data: {
      name: 'Marcus Brody (Staff)',
      email: 'staff1@rentiq.com',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      status: 'ACTIVE'
    }
  });

  const staff2 = await prisma.user.create({
    data: {
      name: 'Sarah Connor (Staff)',
      email: 'staff2@rentiq.com',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      status: 'ACTIVE'
    }
  });

  // 5 Borrowers
  const borrower1 = await prisma.user.create({
    data: {
      name: 'Alexander Hayes',
      email: 'borrower1@rentiq.com',
      passwordHash: borrowerPasswordHash,
      role: 'BORROWER',
      status: 'ACTIVE'
    }
  });

  const borrower2 = await prisma.user.create({
    data: {
      name: 'Beatrice Morales',
      email: 'borrower2@rentiq.com',
      passwordHash: borrowerPasswordHash,
      role: 'BORROWER',
      status: 'ACTIVE'
    }
  });

  const borrower3 = await prisma.user.create({
    data: {
      name: 'Chen Wei',
      email: 'borrower3@rentiq.com',
      passwordHash: borrowerPasswordHash,
      role: 'BORROWER',
      status: 'ACTIVE'
    }
  });

  const borrower4 = await prisma.user.create({
    data: {
      name: 'Daria Petrova',
      email: 'borrower4@rentiq.com',
      passwordHash: borrowerPasswordHash,
      role: 'BORROWER',
      status: 'ACTIVE'
    }
  });

  const borrower5 = await prisma.user.create({
    data: {
      name: 'Evan Scott',
      email: 'borrower5@rentiq.com',
      passwordHash: borrowerPasswordHash,
      role: 'BORROWER',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Seeded 1 Admin, 2 Staff, and 5 Borrowers.');

  // 2. Create Asset Categories
  const catComputing = await prisma.assetCategory.create({
    data: {
      name: 'Computing & Laptops',
      description: 'High-performance engineering laptops, workstations, and computing hardware.'
    }
  });

  const catAV = await prisma.assetCategory.create({
    data: {
      name: 'Cameras & Audio-Visual',
      description: 'Cinema cameras, DSLR rigs, field audio recorders, and production lighting.'
    }
  });

  const catDrones = await prisma.assetCategory.create({
    data: {
      name: 'Drones & Aerial Imaging',
      description: 'Aerial mapping drones, 4K/8K inspection UAVs, and remote pilot packages.'
    }
  });

  const catTools = await prisma.assetCategory.create({
    data: {
      name: 'Power Tools & Field Equipment',
      description: 'Industrial drills, rotary laser levels, impact drivers, and safety equipment.'
    }
  });

  const catScientific = await prisma.assetCategory.create({
    data: {
      name: 'Scientific & Measurement',
      description: 'Digital oscilloscopes, thermal cameras, precision calipers, and spectrometers.'
    }
  });

  console.log('✅ Seeded 5 Asset Categories.');

  // 3. Create 15 Sample Assets
  const assetsData = [
    // Computing
    {
      assetCode: 'AST-COMP-001',
      name: 'MacBook Pro 16" (M3 Max / 64GB / 2TB)',
      categoryId: catComputing.id,
      description: 'Space Black, Apple M3 Max 16-Core, 40-Core GPU, 64GB Unified RAM, 2TB SSD.',
      specifications: JSON.stringify({ cpu: 'M3 Max', ram: '64GB', storage: '2TB', screen: '16.2 Liquid Retina XDR', os: 'macOS Sonoma' }),
      qrToken: 'QR-AST-COMP-001-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'EXCELLENT',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'
    },
    {
      assetCode: 'AST-COMP-002',
      name: 'Dell Precision 5680 Workstation',
      categoryId: catComputing.id,
      description: 'Intel Core i9-13900H, RTX 4000 Ada 12GB, 32GB DDR5, 1TB NVMe, OLED 4K Touch.',
      specifications: JSON.stringify({ cpu: 'i9-13900H', gpu: 'RTX 4000 Ada', ram: '32GB DDR5', storage: '1TB', os: 'Windows 11 Pro' }),
      qrToken: 'QR-AST-COMP-002-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'GOOD',
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80'
    },
    {
      assetCode: 'AST-COMP-003',
      name: 'Lenovo ThinkPad P1 Gen 6',
      categoryId: catComputing.id,
      description: 'Carbon fiber chassis, Intel Core i7, 32GB RAM, RTX 3070Ti, Cellular LTE modem.',
      specifications: JSON.stringify({ cpu: 'i7-13800H', ram: '32GB', storage: '1TB SSD', screen: '16.0 WQXGA 165Hz' }),
      qrToken: 'QR-AST-COMP-003-TOKEN',
      status: 'REQUESTED',
      currentCondition: 'EXCELLENT',
      imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80'
    },

    // Audio-Visual
    {
      assetCode: 'AST-AV-001',
      name: 'Sony FX3 Full-Frame Cinema Camera',
      categoryId: catAV.id,
      description: '4K 120p cinema camera with cage, XLR top handle, 2x CFexpress Type A 160GB cards.',
      specifications: JSON.stringify({ sensor: '12.1MP Full-Frame', mount: 'Sony E-mount', recording: '4K 120p 10-bit 4:2:2', color: 'S-Cinetone' }),
      qrToken: 'QR-AST-AV-001-TOKEN',
      status: 'ISSUED',
      currentCondition: 'EXCELLENT',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'
    },
    {
      assetCode: 'AST-AV-002',
      name: 'Canon EOS R5 C Hybrid Cine Camera',
      categoryId: catAV.id,
      description: '8K 60p RAW recording, 45MP still sensor, dual pixel CMOS AF II, active cooling fan.',
      specifications: JSON.stringify({ sensor: '45MP Full-Frame', resolution: '8K 60p / 4K 120p', mount: 'Canon RF' }),
      qrToken: 'QR-AST-AV-002-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'GOOD',
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80'
    },
    {
      assetCode: 'AST-AV-003',
      name: 'Rode Wireless PRO Dual-Channel Kit',
      categoryId: catAV.id,
      description: 'Dual transmitters, receiver, 32-bit float on-board recording, timecode, Lavalier II.',
      specifications: JSON.stringify({ channels: 2, range: '260m', sampleRate: '32-bit float', accessories: 'Smart charge case, lavs' }),
      qrToken: 'QR-AST-AV-003-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'EXCELLENT',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80'
    },
    {
      assetCode: 'AST-AV-004',
      name: 'DJI RS 3 Pro Gimbal Stabilizer',
      categoryId: catAV.id,
      description: 'Automated axis locks, extended carbon fiber arms, 4.5kg payload, LiDAR focusing motor.',
      specifications: JSON.stringify({ payload: '4.5 kg', batteryLife: '12 hours', connectivity: 'Bluetooth 5.0, NATO ports' }),
      qrToken: 'QR-AST-AV-004-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'GOOD',
      imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80'
    },

    // Drones & Aerial
    {
      assetCode: 'AST-DRN-001',
      name: 'DJI Mavic 3 Pro Cine Combo',
      categoryId: catDrones.id,
      description: 'Triple-camera system (Hasselblad 4/3 CMOS + Dual Tele), Apple ProRes, 1TB SSD, 3x Batteries.',
      specifications: JSON.stringify({ camera: 'Hasselblad 4/3 CMOS + 70mm + 166mm', flightTime: '43 min', transmission: 'O3+ 15km' }),
      qrToken: 'QR-AST-DRN-001-TOKEN',
      status: 'ISSUED',
      currentCondition: 'EXCELLENT',
      imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=80'
    },
    {
      assetCode: 'AST-DRN-002',
      name: 'Skydio 2+ Enterprise Autonomous UAV',
      categoryId: catDrones.id,
      description: '360 degree obstacle avoidance powered by 6 navigation cameras, 4K60 HDR, tablet controller.',
      specifications: JSON.stringify({ avoidance: 'Autonomous 360 AI', sensors: '6x 4K Nav cameras', flightRange: '6km' }),
      qrToken: 'QR-AST-DRN-002-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'FAIR',
      imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80'
    },

    // Power Tools & Field Equipment
    {
      assetCode: 'AST-TOOL-001',
      name: 'DeWalt 20V MAX XR 5-Tool Combo Kit',
      categoryId: catTools.id,
      description: 'Hammer drill, impact driver, circular saw, reciprocating saw, LED worklight, 2x 5Ah batteries.',
      specifications: JSON.stringify({ voltage: '20V MAX', batteries: '2x 5.0Ah XR Lithium Ion', includes: '5 Tools + Heavy Duty Bag' }),
      qrToken: 'QR-AST-TOOL-001-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'GOOD',
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80'
    },
    {
      assetCode: 'AST-TOOL-002',
      name: 'Bosch GRL 900 Rotary Self-Leveling Laser',
      categoryId: catTools.id,
      description: 'Horizontal and vertical self-leveling rotary laser, 300m range with laser receiver, aluminum tripod.',
      specifications: JSON.stringify({ range: '300m with receiver', accuracy: '±1.5mm @ 30m', ipRating: 'IP65 Water/Dust' }),
      qrToken: 'QR-AST-TOOL-002-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'EXCELLENT',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'
    },
    {
      assetCode: 'AST-TOOL-003',
      name: 'Fluke Ti480 PRO Industrial Thermal Camera',
      categoryId: catTools.id,
      description: '640x480 resolution thermal imager, SuperResolution up to 1280x960, temperature range up to 1000°C.',
      specifications: JSON.stringify({ irResolution: '640 x 480 (307,200 pixels)', tempRange: '-20°C to +1000°C', focus: 'LaserSharp Auto' }),
      qrToken: 'QR-AST-TOOL-003-TOKEN',
      status: 'MAINTENANCE',
      currentCondition: 'DAMAGED',
      imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80'
    },

    // Scientific & Measurement
    {
      assetCode: 'AST-SCI-001',
      name: 'Keysight InfiniiVision 4-Channel Oscilloscope',
      categoryId: catScientific.id,
      description: '100MHz 4 analog channels, 1M waveforms/sec update rate, MegaZoom IV, 8.5-inch WVGA display.',
      specifications: JSON.stringify({ bandwidth: '100 MHz', channels: 4, sampleRate: '5 GSa/s', memory: '4 Mpts' }),
      qrToken: 'QR-AST-SCI-001-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'EXCELLENT',
      imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&q=80'
    },
    {
      assetCode: 'AST-SCI-002',
      name: 'Mitutoyo Digimatic Precision Caliper Set',
      categoryId: catScientific.id,
      description: '0-200mm digital vernier caliper, AOS electromagnetic induction sensor, IP67 coolant proof.',
      specifications: JSON.stringify({ range: '0-200mm / 0-8in', resolution: '0.01mm / 0.0005in', accuracy: '±0.02mm' }),
      qrToken: 'QR-AST-SCI-002-TOKEN',
      status: 'AVAILABLE',
      currentCondition: 'GOOD',
      imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80'
    },
    {
      assetCode: 'AST-SCI-003',
      name: 'Leica DISTO D810 Touch Laser Measure',
      categoryId: catScientific.id,
      description: 'Touchscreen laser distance meter with digital Pointfinder camera, measurement in picture technology.',
      specifications: JSON.stringify({ range: '200m', accuracy: '±1.0 mm', features: 'Touchscreen, Bluetooth Smart, Tilt sensor 360°' }),
      qrToken: 'QR-AST-SCI-003-TOKEN',
      status: 'RETURN_INITIATED',
      currentCondition: 'GOOD',
      imageUrl: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80'
    }
  ];

  const createdAssets = {};
  for (const assetInfo of assetsData) {
    const created = await prisma.asset.create({ data: assetInfo });
    createdAssets[created.assetCode] = created;
  }
  console.log('✅ Seeded 15 Sample Assets across categories.');

  // 4. Create Sample Rental Requests
  // Request 1: Pending approval for Lenovo ThinkPad
  const req1 = await prisma.rentalRequest.create({
    data: {
      assetId: createdAssets['AST-COMP-003'].id,
      borrowerId: borrower1.id,
      startDate: new Date(Date.now() + 86400000), // tomorrow
      dueDate: new Date(Date.now() + 86400000 * 5),
      purpose: 'Field software deployment and network load testing at client site.',
      status: 'PENDING'
    }
  });

  // Request 2: Approved request ready to be issued
  const req2 = await prisma.rentalRequest.create({
    data: {
      assetId: createdAssets['AST-AV-002'].id,
      borrowerId: borrower2.id,
      startDate: new Date(Date.now() + 86400000 * 2),
      dueDate: new Date(Date.now() + 86400000 * 6),
      purpose: 'Annual executive conference keynote multi-camera recording.',
      status: 'APPROVED',
      approvedBy: admin.id
    }
  });

  // 5. Create Active Rentals
  // Rental 1: Active Rental for Sony FX3 Camera
  const rental1 = await prisma.rental.create({
    data: {
      assetId: createdAssets['AST-AV-001'].id,
      borrowerId: borrower3.id,
      issuedBy: staff1.id,
      issueDate: new Date(Date.now() - 86400000 * 2),
      dueDate: new Date(Date.now() + 86400000 * 3),
      status: 'ACTIVE',
      preCondition: 'EXCELLENT',
      preNotes: 'Lens element pristine, sensor clean, verified recording with both CFexpress cards.',
      prePhotos: JSON.stringify(['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80'])
    }
  });

  // Rental 2: OVERDUE Rental for DJI Mavic 3 Pro Cine (due yesterday!)
  const rental2 = await prisma.rental.create({
    data: {
      assetId: createdAssets['AST-DRN-001'].id,
      borrowerId: borrower4.id,
      issuedBy: staff2.id,
      issueDate: new Date(Date.now() - 86400000 * 7),
      dueDate: new Date(Date.now() - 86400000 * 1), // 1 day overdue!
      status: 'OVERDUE',
      preCondition: 'EXCELLENT',
      preNotes: 'Pre-flight verified, firmware v01.00.0700, 3 smart batteries at 100% capacity.',
      prePhotos: JSON.stringify(['https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&q=80'])
    }
  });

  // Rental 3: Return Initiated Rental for Leica DISTO D810
  const rental3 = await prisma.rental.create({
    data: {
      assetId: createdAssets['AST-SCI-003'].id,
      borrowerId: borrower5.id,
      issuedBy: staff1.id,
      issueDate: new Date(Date.now() - 86400000 * 4),
      dueDate: new Date(Date.now() + 86400000 * 1),
      status: 'RETURN_INITIATED',
      preCondition: 'GOOD',
      preNotes: 'Screen clean, pouch included, calibration test valid.',
      prePhotos: JSON.stringify(['https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&q=80'])
    }
  });

  // 6. Damage Report and Maintenance Record for Fluke Ti480 PRO
  const damage1 = await prisma.damageReport.create({
    data: {
      assetId: createdAssets['AST-TOOL-003'].id,
      reportedBy: staff1.id,
      description: 'Front germanium infrared protective window scratched; battery bay latch cracked.',
      severity: 'HIGH',
      status: 'OPEN'
    }
  });

  await prisma.maintenance.create({
    data: {
      assetId: createdAssets['AST-TOOL-003'].id,
      damageReportId: damage1.id,
      description: 'Order replacement Germanium optical window and latch assembly. Re-calibration required.',
      maintenanceStatus: 'IN_PROGRESS',
      cost: 480.00,
      startedAt: new Date(Date.now() - 86400000 * 2)
    }
  });

  console.log('✅ Seeded Sample Requests, Active & Overdue Rentals, Damage & Maintenance tickets.');

  // 7. Seed In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: borrower4.id,
        title: '⚠️ Asset Return Overdue!',
        message: 'Your rental for DJI Mavic 3 Pro Cine Combo was due on yesterday. Please return immediately to avoid penalty points.',
        isRead: false
      },
      {
        userId: borrower2.id,
        title: '🎉 Rental Request Approved',
        message: 'Your request for Canon EOS R5 C Hybrid Cine Camera has been approved by Eleanor Vance.',
        isRead: false
      },
      {
        userId: staff1.id,
        title: '📦 Return Inspection Pending',
        message: 'Evan Scott initiated return for Leica DISTO D810 Touch Laser Measure. Ready for digital inspection.',
        isRead: false
      },
      {
        userId: admin.id,
        title: '🛠️ New Maintenance Order',
        message: 'Fluke Ti480 PRO Thermal Camera was flagged as DAMAGED and placed in maintenance queue.',
        isRead: true
      }
    ]
  });

  // 8. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'SYSTEM_INITIALIZED',
        entityType: 'SYSTEM',
        entityId: 'SYSTEM',
        oldValue: null,
        newValue: 'Initial database seeding completed with 15 assets and 8 users.',
        ipAddress: '127.0.0.1'
      },
      {
        userId: borrower1.id,
        action: 'RENTAL_REQUEST_SUBMITTED',
        entityType: 'RENTAL_REQUEST',
        entityId: req1.id,
        oldValue: null,
        newValue: 'Request submitted for Lenovo ThinkPad P1 Gen 6',
        ipAddress: '192.168.1.101'
      },
      {
        userId: admin.id,
        action: 'RENTAL_REQUEST_APPROVED',
        entityType: 'RENTAL_REQUEST',
        entityId: req2.id,
        oldValue: 'PENDING',
        newValue: 'APPROVED',
        ipAddress: '192.168.1.100'
      },
      {
        userId: staff1.id,
        action: 'ASSET_ISSUED',
        entityType: 'RENTAL',
        entityId: rental1.id,
        oldValue: 'APPROVED',
        newValue: 'ISSUED',
        ipAddress: '192.168.1.105'
      },
      {
        userId: staff1.id,
        action: 'DAMAGE_REPORT_CREATED',
        entityType: 'DAMAGE_REPORT',
        entityId: damage1.id,
        oldValue: 'AVAILABLE',
        newValue: 'MAINTENANCE',
        ipAddress: '192.168.1.105'
      }
    ]
  });

  console.log('✅ Seeded Notifications and Audit Logs.');
  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
