export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Forcer l'encodage en AVIF
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // Supprimer l'ancienne extension et ajouter .avif
                            const orgName = file.name ? file.name.split('.').slice(0, -1).join('.') : 'image';
                            const newFilename = orgName ? `${orgName}.avif` : 'image.avif';
                            const newFile = new File([blob], newFilename, {
                                type: 'image/avif',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            // En cas d'échec du navigateur sur l'AVIF, fallback silencieux vers WEBP possible
                            // mais on reste sur le type avif pour forcer si ça marche
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/avif',
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}
