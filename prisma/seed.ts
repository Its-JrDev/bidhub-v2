import { PrismaClient, Role, AuctionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BidHub database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default passwords
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  // 3. Create Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bidhub.com',
      name: 'System Administrator',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  // 4. Create standard users (Sellers & Bidders)
  const alice = await prisma.user.create({
    data: {
      email: 'alice@bidhub.com',
      name: 'Alice Collector',
      passwordHash: userPassword,
      role: Role.USER,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@bidhub.com',
      name: 'Bob Enthusiast',
      passwordHash: userPassword,
      role: Role.USER,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@bidhub.com',
      name: 'Charlie Hunter',
      passwordHash: userPassword,
      role: Role.USER,
    },
  });

  console.log('✅ Users created: admin@bidhub.com, alice@bidhub.com, bob@bidhub.com, charlie@bidhub.com');

  // 5. Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Cartas Coleccionables',
        description: 'Cartas Pokémon, Magic: The Gathering, Yu-Gi-Oh y deportes.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Relojes de Lujo',
        description: 'Piezas vintage y modernas de alta relojería suiza y japonesa.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Discos de Vinilo',
        description: 'Primeras ediciones, vinilos de colección y cajas conmemorativas.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Figuras y Cómics',
        description: 'Figuras de acción, estatuas numeradas y cómics de colección.',
      },
    }),
  ]);

  const [cardsCat, watchesCat, vinylCat, figuresCat] = categories;
  console.log(`✅ ${categories.length} categories created.`);

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // 6. Create Auctions in various states

  // A. ACTIVE Auction (with bids)
  const activeAuction1 = await prisma.auction.create({
    data: {
      title: 'Charizard 1st Edition Shadowless PSA 9',
      description: 'Carta original de 1999 Base Set Shadowless en perfecto estado de conservación certificado.',
      imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=80',
      startingPrice: 500,
      currentPrice: 650,
      minIncrement: 50,
      status: AuctionStatus.ACTIVE,
      startsAt: yesterday,
      endsAt: inThreeDays,
      sellerId: alice.id,
      categoryId: cardsCat.id,
    },
  });

  // Bids on active auction
  await prisma.bid.create({
    data: {
      amount: 500,
      auctionId: activeAuction1.id,
      bidderId: bob.id,
      createdAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000),
    },
  });

  await prisma.bid.create({
    data: {
      amount: 550,
      auctionId: activeAuction1.id,
      bidderId: charlie.id,
      createdAt: new Date(yesterday.getTime() + 6 * 60 * 60 * 1000),
    },
  });

  await prisma.bid.create({
    data: {
      amount: 650,
      auctionId: activeAuction1.id,
      bidderId: bob.id,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
  });

  // B. ACTIVE Auction ending soon (without bids)
  await prisma.auction.create({
    data: {
      title: 'Omega Speedmaster Professional Moonwatch 1971',
      description: 'Calibre 861 original, dial impecable, recién revisado por relojero certificado.',
      imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
      startingPrice: 3200,
      currentPrice: 3200,
      minIncrement: 100,
      status: AuctionStatus.ACTIVE,
      startsAt: now,
      endsAt: inTwoHours,
      sellerId: bob.id,
      categoryId: watchesCat.id,
    },
  });

  // C. CLOSED Auction (with winner)
  const closedAuction = await prisma.auction.create({
    data: {
      title: 'The Beatles - Abbey Road Original UK First Pressing 1969',
      description: 'Copia matriz -2/-1 con etiqueta de manzana desalineada original.',
      imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80',
      startingPrice: 150,
      currentPrice: 380,
      minIncrement: 20,
      status: AuctionStatus.CLOSED,
      startsAt: twoDaysAgo,
      endsAt: yesterday,
      sellerId: charlie.id,
      categoryId: vinylCat.id,
      winnerId: alice.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 150,
      auctionId: closedAuction.id,
      bidderId: bob.id,
      createdAt: new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000),
    },
  });

  await prisma.bid.create({
    data: {
      amount: 380,
      auctionId: closedAuction.id,
      bidderId: alice.id,
      createdAt: new Date(yesterday.getTime() - 20 * 60 * 1000),
    },
  });

  // D. DESERTED Auction (ended with no bids)
  await prisma.auction.create({
    data: {
      title: 'Figura Spider-Man Hot Toys 1/6 Edición Limitada',
      description: 'Nuevo en caja sellada, incluye accesorios exclusivos de convención.',
      imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
      startingPrice: 400,
      currentPrice: 400,
      minIncrement: 25,
      status: AuctionStatus.DESERTED,
      startsAt: twoDaysAgo,
      endsAt: yesterday,
      sellerId: alice.id,
      categoryId: figuresCat.id,
    },
  });

  // E. CANCELLED Auction (moderated by admin with mandatory reason)
  await prisma.auction.create({
    data: {
      title: 'Rolex Submariner No Date (Copia / Replica Vintage)',
      description: 'Homenaje vintage no original.',
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
      startingPrice: 100,
      currentPrice: 100,
      minIncrement: 10,
      status: AuctionStatus.CANCELLED,
      cancellationReason: 'Infracción de términos: Artículos réplica o falsificaciones prohibidos en BidHub.',
      startsAt: yesterday,
      endsAt: inThreeDays,
      sellerId: bob.id,
      categoryId: watchesCat.id,
    },
  });

  console.log('✅ Seed completed successfully with active, closed, deserted, and cancelled auctions.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
