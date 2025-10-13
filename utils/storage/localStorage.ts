// Utilitaires pour gérer les données de formulaire en localStorage

export const STORAGE_KEYS = {
    BOAT_DESCRIPTION: 'boat_description_temp',
    BOAT_FORM_DATA: 'boat_form_data_temp'
};

// Sauvegarder la description
export function saveBoatDescription(description: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.BOAT_DESCRIPTION, description);
    }
}

// Récupérer la description
export function getBoatDescription(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEYS.BOAT_DESCRIPTION);
    }
    return null;
}

// Supprimer la description
export function clearBoatDescription(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.BOAT_DESCRIPTION);
    }
}

// Sauvegarder toutes les données du formulaire
export function saveBoatFormData(formData: {
    model: string;
    price: string;
    country: string;
    description: string;
    currency: string;
    specifications: string[];
    vatPaid: boolean;
}): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.BOAT_FORM_DATA, JSON.stringify(formData));
    }
}

// Récupérer toutes les données du formulaire
export function getBoatFormData(): any | null {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEYS.BOAT_FORM_DATA);
        return data ? JSON.parse(data) : null;
    }
    return null;
}

// Supprimer toutes les données du formulaire
export function clearBoatFormData(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.BOAT_FORM_DATA);
        localStorage.removeItem(STORAGE_KEYS.BOAT_DESCRIPTION);
    }
} 