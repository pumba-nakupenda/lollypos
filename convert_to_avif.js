const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'lollyshop', '.env.local') });

// IMPORTANT: This script requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// from the .env.local file to bypass RLS.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables! Ensure .env.local is present.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = 'products'; // Your Supabase storage bucket name

async function convertAndReupload() {
    console.log('🚀 Démarrage du script de conversion AVIF...');

    // 1. Lister tous les fichiers du bucket
    const { data: files, error: listError } = await supabase.storage.from(BUCKET).list('', {
        limit: 1000,
        search: ''
    });

    if (listError) {
        console.error('❌ Erreur lors de la récupération des fichiers:', listError);
        return;
    }

    if (!files || files.length === 0) {
        console.log('ℹ️ Aucun fichier trouvé dans le bucket.');
        return;
    }

    // Filtrer pour éviter de re-convertir les fichiers déjà en AVIF
    const filesToConvert = files.filter(f => !f.name.endsWith('.avif') && f.metadata?.mimetype?.startsWith('image/'));

    console.log(`📦 ${files.length} fichiers trouvés. ${filesToConvert.length} à convertir en AVIF.`);

    let successCount = 0;
    let skipCount = 0;
    let errCount = 0;

    for (const file of filesToConvert) {
        try {
            console.log(`\n⏳ Traitement de : ${file.name}`);

            // 2. Télécharger le fichier existant
            const { data: fileData, error: dlError } = await supabase.storage.from(BUCKET).download(file.name);

            if (dlError) {
                console.error(`❌ Erreur DL ${file.name}:`, dlError);
                errCount++;
                continue;
            }

            const buffer = Buffer.from(await fileData.arrayBuffer());

            // 3. Convertir en AVIF
            const avifBuffer = await sharp(buffer)
                .avif({ quality: 80, effort: 4 }) // Effort 4 (default) offers a good balance of speed and compression
                .toBuffer();

            const oldExtension = path.extname(file.name);
            const baseName = path.basename(file.name, oldExtension);
            const newName = `${baseName}.avif`;

            // 4. Uploader le nouveau fichier AVIF
            const { error: ulError } = await supabase.storage.from(BUCKET).upload(newName, avifBuffer, {
                contentType: 'image/avif',
                cacheControl: '3600',
                upsert: true
            });

            if (ulError) {
                console.error(`❌ Erreur UL AVIF ${newName}:`, ulError);
                errCount++;
                continue;
            }

            console.log(`✅ ${file.name} -> ${newName} (${(buffer.length / 1024).toFixed(1)}KB -> ${(avifBuffer.length / 1024).toFixed(1)}KB)`);

            // OPTIONNEL : Mettre à jour la base de données pour pointer vers la nouvelle URL
            // (Il faudrait chercher dans la table products les occurrences de l'ancienne URL et la remplacer)
            const oldPublicUrl = supabase.storage.from(BUCKET).getPublicUrl(file.name).data.publicUrl;
            const newPublicUrl = supabase.storage.from(BUCKET).getPublicUrl(newName).data.publicUrl;

            // Mise à jour de la colonne image principale
            const { data: updatedProds, error: dbErr1 } = await supabase
                .from('products')
                .update({ image: newPublicUrl })
                .eq('image', oldPublicUrl)
                .select('id');

            if (dbErr1) {
                console.error(`⚠️ Erreur BDD (image) for ${newName}:`, dbErr1);
            } else if (updatedProds && updatedProds.length > 0) {
                console.log(`   🔄 BDD : image principale mise à jour pour ${updatedProds.length} produit(s).`);
            }

            // NOTE: Updating JSON arrays (like `images` gallery or `variants`) in Supabase via SQL/JS 
            // is more complex and might require a custom Postgres function or fetching/replacing.
            // For now, this script uploads the AVIF and updates the main `image` column.

            successCount++;

        } catch (err) {
            console.error(`❌ Erreur inattendue sur ${file.name}:`, err);
            errCount++;
        }
    }

    console.log(`\n🎉 Terminé ! Succès: ${successCount}, Ignorés: ${skipCount}, Erreurs: ${errCount}`);
    console.log(`⚠️ Note : La suppression des anciennes images n'est pas automatique par sécurité. Vous pouvez les effacer depuis le dashboard Supabase une fois que vous avez vérifié que les nouvelles images AVIF s'affichent correctement.`);
}

convertAndReupload();
