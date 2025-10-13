// Fonctions côté client pour la gestion des bateaux

export async function emergencyCleanupClient(boatId: string, reason: string): Promise<{ success: boolean; method?: string }> {
    try {
        console.log(`🚨 Emergency cleanup triggered for boat ${boatId} - Reason: ${reason}`);

        const response = await fetch('/api/boats/emergency-cleanup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                boatId,
                reason
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Emergency cleanup successful for boat ${boatId}`);
            return { success: true, method: result.method };
        } else {
            console.error(`❌ Emergency cleanup failed for boat ${boatId}:`, result.error);
            return { success: false };
        }
    } catch (error) {
        console.error(`❌ Error during emergency cleanup for boat ${boatId}:`, error);
        return { success: false };
    }
} 