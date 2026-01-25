import { User } from '../types';

export interface Sale {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    productModel: string;
    serialNumber: string;
    saleDate: string;
    branchId: string;
    warrantyId: string;
    status: 'pending' | 'approved' | 'rejected';
}

const MOCK_SALES: Sale[] = [
    {
        id: '1',
        customerName: 'Apurv Deshmukh',
        customerPhone: '9876543210',
        customerEmail: 'apurv@example.com',
        productModel: 'Model X',
        serialNumber: 'SN12345678',
        saleDate: '2023-10-26',
        branchId: 'sub1',
        warrantyId: 'WAR-001',
        status: 'approved',
    },
    {
        id: '2',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        customerEmail: 'john@example.com',
        productModel: 'Model Y',
        serialNumber: 'SN87654321',
        saleDate: '2023-10-27',
        branchId: 'sub1',
        warrantyId: 'WAR-002',
        status: 'pending',
    },
];

export const SalesService = {
    getSalesByBranch: async (branchId: string): Promise<Sale[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_SALES.filter(sale => sale.branchId === branchId);
    },

    getAllSales: async (): Promise<Sale[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_SALES;
    },

    createSale: async (saleData: Omit<Sale, 'id' | 'warrantyId' | 'status'>): Promise<Sale> => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newSale: Sale = {
            ...saleData,
            id: Math.random().toString(36).substr(2, 9),
            warrantyId: `WAR-${Math.floor(Math.random() * 1000)}`,
            status: 'approved', // Auto-approve for demo
        };
        MOCK_SALES.push(newSale);
        return newSale;
    },
};
