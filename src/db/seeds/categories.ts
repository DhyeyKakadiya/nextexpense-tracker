import { db } from '@/db';
import { categories } from '@/db/schema';

async function main() {
    const sampleCategories = [
        {
            userId: 1,
            name: 'Food',
            color: '#ff6b6b',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 1,
            name: 'Rent',
            color: '#4ecdc4',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 1,
            name: 'Salary',
            color: '#45b7d1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 1,
            name: 'Entertainment',
            color: '#f7b731',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 1,
            name: 'Transport',
            color: '#5f27cd',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 1,
            name: 'Utilities',
            color: '#00d2d3',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 1,
            name: 'Others',
            color: '#ff9ff3',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(categories).values(sampleCategories);
    
    console.log('✅ Categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});