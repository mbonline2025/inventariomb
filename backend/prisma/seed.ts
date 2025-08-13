import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Criar usuário admin padrão
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mbconsultoria.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@mbconsultoria.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Usuário admin criado:', admin.email);

  // Criar alguns departamentos
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { id: 'dept-ti' },
      update: {},
      create: {
        id: 'dept-ti',
        name: 'Tecnologia da Informação',
        description: 'Departamento responsável pela infraestrutura de TI',
      },
    }),
    prisma.department.upsert({
      where: { id: 'dept-rh' },
      update: {},
      create: {
        id: 'dept-rh',
        name: 'Recursos Humanos',
        description: 'Departamento de gestão de pessoas',
      },
    }),
    prisma.department.upsert({
      where: { id: 'dept-financeiro' },
      update: {},
      create: {
        id: 'dept-financeiro',
        name: 'Financeiro',
        description: 'Departamento financeiro e contábil',
      },
    }),
  ]);

  console.log('Departamentos criados:', departments.length);

  // Criar alguns fornecedores
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { id: 'vendor-apple' },
      update: {},
      create: {
        id: 'vendor-apple',
        name: 'Apple Inc.',
        type: 'FABRICANTE',
        contactEmail: 'contato@apple.com',
        notes: 'Fornecedor de equipamentos Apple',
      },
    }),
    prisma.vendor.upsert({
      where: { id: 'vendor-dell' },
      update: {},
      create: {
        id: 'vendor-dell',
        name: 'Dell Technologies',
        type: 'FABRICANTE',
        contactEmail: 'contato@dell.com',
        notes: 'Fornecedor de equipamentos Dell',
      },
    }),
    prisma.vendor.upsert({
      where: { id: 'vendor-microsoft' },
      update: {},
      create: {
        id: 'vendor-microsoft',
        name: 'Microsoft Corporation',
        type: 'FABRICANTE',
        contactEmail: 'contato@microsoft.com',
        notes: 'Fornecedor de software Microsoft',
      },
    }),
  ]);

  console.log('Fornecedores criados:', vendors.length);

  // Criar alguns softwares
  const softwares = await Promise.all([
    prisma.software.upsert({
      where: { id: 'soft-office365' },
      update: {},
      create: {
        id: 'soft-office365',
        name: 'Microsoft Office 365',
        version: '2024',
        category: 'Produtividade',
        vendorId: 'vendor-microsoft',
        notes: 'Suite de produtividade Microsoft',
      },
    }),
    prisma.software.upsert({
      where: { id: 'soft-windows11' },
      update: {},
      create: {
        id: 'soft-windows11',
        name: 'Windows 11 Pro',
        version: '23H2',
        category: 'Sistema Operacional',
        vendorId: 'vendor-microsoft',
        notes: 'Sistema operacional Windows 11',
      },
    }),
  ]);

  console.log('Softwares criados:', softwares.length);

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

