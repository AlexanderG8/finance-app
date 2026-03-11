import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Alimentación', emoji: '🍕', color: '#FF6B6B' },
  { name: 'Transporte', emoji: '🚗', color: '#4ECDC4' },
  { name: 'Salud', emoji: '💊', color: '#45B7D1' },
  { name: 'Entretenimiento', emoji: '🎮', color: '#96CEB4' },
  { name: 'Suscripciones', emoji: '📱', color: '#FFEAA7' },
  { name: 'Servicios del hogar', emoji: '🏠', color: '#DDA0DD' },
  { name: 'Educación', emoji: '📚', color: '#98D8C8' },
  { name: 'Ropa y accesorios', emoji: '👕', color: '#F7DC6F' },
  { name: 'Otros', emoji: '💼', color: '#BDC3C7' },
];

async function main(): Promise<void> {
  console.log('Seeding expense categories...');

  for (const category of categories) {
    await prisma.expenseCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log(`Seeded ${categories.length} categories successfully.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
