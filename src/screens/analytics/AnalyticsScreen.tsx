import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SalesService, Sale } from '../../services/SalesService';
import { useAuth } from '../../context/AuthContext';
import MeshBackground from '../../components/MeshBackground';
import DetailedAnalyticsContent from '../../components/DetailedAnalyticsContent';
import { THEME } from '../../constants/theme';

export default function AnalyticsScreen() {
    const { user } = useAuth();
    const [sales, setSales] = React.useState<Sale[]>([]);

    React.useEffect(() => {
        SalesService.getAllSales().then(allSales => {
            if (user?.role === 'Super Admin' || !user?.branchId) {
                setSales(allSales);
            } else {
                setSales(allSales.filter(s => s.branchId === user?.branchId));
            }
        });
    }, [user]);

    return (
        <MeshBackground>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <DetailedAnalyticsContent sales={sales} />
            </ScrollView>
        </MeshBackground>
    );
}

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 40 },
});
