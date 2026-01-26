import { Storage } from '../utils/storage';

export interface Sale {
    id: string;
    customerName: string;
    phone: string;
    email: string;
    city: string;
    productModel: string;
    serialNumber: string;
    saleDate: string;
    branchId: string;
    warrantyId: string;
    status: 'pending' | 'approved' | 'rejected';
}

const STORAGE_KEY = 'WARRANTY_PRO_SALES';

const MOCK_INITIAL_SALES: Sale[] = [
    {
        id: '1',
        customerName: 'Apurv Deshmukh',
        phone: '9876543210',
        email: 'apurv@example.com',
        city: 'Mumbai',
        productModel: 'Inverter Model X',
        serialNumber: 'SN12345678',
        saleDate: '2023-10-26',
        branchId: 'sub1',
        warrantyId: 'WAR-001',
        status: 'approved',
    },
    {
        id: '2',
        customerName: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        city: 'Delhi',
        productModel: 'Battery Model Z',
        serialNumber: 'SN87654321',
        saleDate: '2023-10-27',
        branchId: 'sub1',
        warrantyId: 'WAR-002',
        status: 'pending',
    },
];

export const SalesService = {
    getSales: async (): Promise<Sale[]> => {
        const stored = await Storage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Initialize with mocks if empty
        await Storage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INITIAL_SALES));
        return MOCK_INITIAL_SALES;
    },

    getSalesByBranch: async (branchId: string): Promise<Sale[]> => {
        const sales = await SalesService.getSales();
        return sales.filter(sale => sale.branchId === branchId);
    },

    getAllSales: async (): Promise<Sale[]> => {
        return await SalesService.getSales();
    },

    createSale: async (saleData: Omit<Sale, 'id' | 'warrantyId' | 'status'>): Promise<Sale> => {
        const sales = await SalesService.getSales();

        const newSale: Sale = {
            ...saleData,
            id: Math.random().toString(36).substr(2, 9),
            warrantyId: `WAR-${Math.floor(100000 + Math.random() * 900000)}`,
            status: 'approved', // Auto-approve for demo
        };

        const updatedSales = [newSale, ...sales];
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
        return newSale;
    },

    updateSaleStatus: async (saleId: string, status: Sale['status']): Promise<void> => {
        const sales = await SalesService.getSales();
        const updatedSales = sales.map(s => s.id === saleId ? { ...s, status } : s);
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
    }
};
