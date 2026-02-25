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

                // Forcer l'encodage en WebP pour une meilleure performance
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // Supprimer l'ancienne extension et ajouter .webp
                            const orgName = file.name ? file.name.split('.').slice(0, -1).join('.') : 'image';
                            const newFilename = orgName ? `${orgName}.webp` : 'image.webp';
                            const newFile = new File([blob], newFilename, {
                                type: 'image/webp',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            // En cas d'échec du navigateur sur l'WebP
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}
