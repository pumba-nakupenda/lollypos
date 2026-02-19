export interface CategoryGroup {
    title: string;
    categories: string[];
}

export interface CategoryGroupConfig {
    title: string;
    match: string[];
}

const DEFAULT_GROUPS = [
    {
        title: "Beauté & Maquillage",
        match: [
            "Maquillage", "Fond de teint", "Gloss", "Mascara", "Poudre", "Rouge à Lèvres",
            "Yeux", "Pinceaux", "Accessoires / Pinceaux", "Crayon", "Eye Liner", "Palette",
            "Sains & Beauté", "Soins", "Visage", "Corps", "Cheveux", "Ongles"
        ]
    },
    {
        title: "Bijoux & Montres",
        match: ["Bijoux", "Montres", "Parrure", "Sautoire", "Bracelet", "Boucles", "Bague", "Collier", "Chaine"]
    },
    {
        title: "Maroquinerie & Accessoires",
        match: ["Sacs", "Saccoche", "Portefeuille", "Ceinture", "Lunettes", "Chapeau", "Casquette", "Bonnet"]
    },
    {
        title: "Parfums",
        match: ["Parfum", "Eau de toilette"]
    },
    {
        title: "Maison & Déco",
        match: ["Maison", "Déco", "Cuisine", "Salle de bain", "Chambre", "Salon"]
    },
    {
        title: "High-Tech",
        match: ["Téléphone", "Smartphone", "Tablette", "Ordinateur", "Accessoires Tel", "Audio", "Son", "Image"]
    }
];

export function groupCategories(categories: string[], config: CategoryGroupConfig[] = []): CategoryGroup[] {
    const definitions = (config && config.length > 0) ? config : DEFAULT_GROUPS;

    const groups: CategoryGroup[] = definitions.map(g => ({
        title: g.title,
        categories: []
    }));

    // "Autres" group for anything that doesn't match
    const otherGroup: CategoryGroup = {
        title: "Autres",
        categories: []
    };

    categories.forEach(cat => {
        let matched = false;

        // Try to find a group for this category
        for (let i = 0; i < definitions.length; i++) {
            const def = definitions[i];
            // Check if any match string is contained in the category name (case insensitive)
            if (def.match.some(m => cat.toLowerCase().includes(m.toLowerCase()))) {
                groups[i].categories.push(cat);
                matched = true;
                break; // Stop after first match to avoid duplicates across groups
            }
        }

        if (!matched) {
            otherGroup.categories.push(cat);
        }
    });

    // Filter out empty groups and add "Autres" at the end if it has items
    const result = groups.filter(g => g.categories.length > 0);
    if (otherGroup.categories.length > 0) {
        result.push(otherGroup);
    }

    return result;
}
