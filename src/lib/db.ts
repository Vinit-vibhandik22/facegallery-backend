import { supabase } from './supabase';

// ============================================
// PROJECTS
// ============================================
export async function getProjects() {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getProject(id: string) {
    // Log current user for debugging
    const { data: { user } } = await supabase.auth.getUser();
    console.log('getProject: user id =', user?.id, 'project id =', id);

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) {
        console.error('getProject error:', error.message, error.code, error.details);
        return null;
    }
    console.log('getProject result:', data ? 'found' : 'NOT FOUND', data?.studio_id);
    return data;
}

export async function createProject(name: string, eventDate: string, description?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Ensure studio record exists (trigger may not have fired)
    const { data: studio } = await supabase
        .from('studios')
        .select('id')
        .eq('id', user.id)
        .single();

    if (!studio) {
        const { error: studioError } = await supabase
            .from('studios')
            .insert({
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.studio_name || 'My Studio',
            });
        if (studioError && !studioError.message.includes('duplicate')) {
            throw new Error('Failed to create studio profile: ' + studioError.message);
        }
    }

    const { data, error } = await supabase
        .from('projects')
        .insert({ studio_id: user.id, name, event_date: eventDate || null, description })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateProject(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteProject(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
}

// ============================================
// PHOTOS
// ============================================
export async function uploadPhoto(projectId: string, file: File) {
    const ext = file.name.split('.').pop();
    const path = `${projectId}/${crypto.randomUUID()}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, file, { contentType: file.type });
    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(path);

    // Insert photo record
    const { data, error } = await supabase
        .from('photos')
        .insert({
            project_id: projectId,
            storage_path: path,
            original_filename: file.name,
            file_size: file.size,
        })
        .select()
        .single();
    if (error) throw error;

    return { ...data, publicUrl };
}

export async function getPhotos(projectId: string) {
    const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
    if (error) throw error;

    // Attach public URLs
    return data.map(photo => ({
        ...photo,
        publicUrl: supabase.storage.from('photos').getPublicUrl(photo.storage_path).data.publicUrl,
    }));
}

export async function updatePhotoFaceCount(photoId: string, faceCount: number) {
    await supabase.from('photos').update({ face_count: faceCount }).eq('id', photoId);
}

// ============================================
// FACE CLUSTERS
// ============================================
export async function getClusters(projectId: string) {
    const { data, error } = await supabase
        .from('face_clusters')
        .select('*')
        .eq('project_id', projectId)
        .order('photo_count', { ascending: false });
    if (error) throw error;
    return data;
}

export async function createCluster(projectId: string, label: string | null, thumbnailUrl: string, photoCount: number, avgConfidence: number) {
    const { data, error } = await supabase
        .from('face_clusters')
        .insert({ project_id: projectId, label, thumbnail_url: thumbnailUrl, photo_count: photoCount, avg_confidence: avgConfidence })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateCluster(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
        .from('face_clusters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteCluster(id: string) {
    await supabase.from('face_clusters').delete().eq('id', id);
}

export async function mergeClusters(sourceId: string, targetId: string) {
    // 1. Update all photos that were in the source cluster to point to the target cluster
    // Using upsert logic to avoid duplicates if a photo was somehow in both
    const { data: mappings, error: fetchError } = await supabase
        .from('photo_cluster_map')
        .select('*')
        .eq('cluster_id', sourceId);
    
    if (fetchError) throw fetchError;

    if (mappings && mappings.length > 0) {
        const newMappings = mappings.map(m => ({
            photo_id: m.photo_id,
            cluster_id: targetId,
            confidence: m.confidence,
            face_bbox: m.face_bbox
        }));
        
        const { error: upsertError } = await supabase
            .from('photo_cluster_map')
            .upsert(newMappings, { onConflict: 'photo_id,cluster_id' });
            
        if (upsertError) throw upsertError;
    }

    // 2. Clear source mappings
    await supabase.from('photo_cluster_map').delete().eq('cluster_id', sourceId);

    // 3. Update target cluster count
    const { data: clusterPhotos } = await supabase
        .from('photo_cluster_map')
        .select('photo_id', { count: 'exact', head: true })
        .eq('cluster_id', targetId);
    
    const count = clusterPhotos?.length || 0;
    await supabase.from('face_clusters').update({ photo_count: count }).eq('id', targetId);

    // 4. Delete source cluster
    await supabase.from('face_clusters').delete().eq('id', sourceId);
}

export async function deleteAllProjectClusters(projectId: string) {
    // First fetch all clusters for this project
    const { data: clusters } = await supabase.from('face_clusters').select('id').eq('project_id', projectId);
    if (!clusters || clusters.length === 0) return;
    
    // Delete in chunks or one by one to ensure maps also cascade if not setup properly
    for (const cluster of clusters) {
        await supabase.from('photo_cluster_map').delete().eq('cluster_id', cluster.id);
        await supabase.from('gallery_links').delete().eq('cluster_id', cluster.id);
        await supabase.from('face_clusters').delete().eq('id', cluster.id);
    }
}

// ============================================
// PHOTO-CLUSTER MAPPINGS
// ============================================
export async function createPhotoClusterMapping(photoId: string, clusterId: string, confidence: number, faceBbox?: object) {
    const { error } = await supabase
        .from('photo_cluster_map')
        .upsert({ photo_id: photoId, cluster_id: clusterId, confidence, face_bbox: faceBbox }, { onConflict: 'photo_id,cluster_id' });
    if (error) throw error;
}

export async function getClusterPhotos(clusterId: string) {
    const { data, error } = await supabase
        .from('photo_cluster_map')
        .select('*, photos(*)')
        .eq('cluster_id', clusterId)
        .order('confidence', { ascending: false });
    if (error) throw error;

    return data.map((mapping: Record<string, unknown>) => {
        const photo = mapping.photos as Record<string, unknown>;
        return {
            ...photo,
            confidence: mapping.confidence,
            faceBbox: mapping.face_bbox,
            publicUrl: supabase.storage.from('photos').getPublicUrl(photo.storage_path as string).data.publicUrl,
        };
    });
}

// ============================================
// GALLERY LINKS
// ============================================
export async function getGalleryLinks(projectId: string) {
    const { data, error } = await supabase
        .from('gallery_links')
        .select('*, face_clusters!inner(id, label, photo_count, project_id)')
        .eq('face_clusters.project_id', projectId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function createGalleryLink(clusterId: string, expiryDays: number = 30) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const { data, error } = await supabase
        .from('gallery_links')
        .insert({ cluster_id: clusterId, expires_at: expiresAt.toISOString() })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getGalleryByToken(token: string) {
    // Get the link
    const { data: link, error: linkError } = await supabase
        .from('gallery_links')
        .select('*, face_clusters(*, projects(*, studios(*)))')
        .eq('token', token)
        .single();
    if (linkError || !link) return null;

    // Check expiry and active status
    if (!link.is_active || new Date(link.expires_at) < new Date()) return null;

    // Get photos for this cluster
    const photos = await getClusterPhotos(link.cluster_id);

    // Increment view count
    await supabase
        .from('gallery_links')
        .update({ view_count: (link.view_count || 0) + 1 })
        .eq('id', link.id);

    const cluster = link.face_clusters as Record<string, unknown>;
    const project = cluster.projects as Record<string, unknown>;
    const studio = project.studios as Record<string, unknown>;

    return {
        link,
        cluster,
        project,
        studio,
        photos,
    };
}

// ============================================
// STUDIO SETTINGS
// ============================================
export async function updateStudioSettings(updates: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('studios')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ============================================
// ANALYTICS
// ============================================
export async function getProjectAnalytics(projectId: string) {
    const [clusters, links] = await Promise.all([
        getClusters(projectId),
        getGalleryLinks(projectId),
    ]);

    const totalViews = links.reduce((sum: number, l: Record<string, unknown>) => sum + ((l.view_count as number) || 0), 0);
    const totalDownloads = links.reduce((sum: number, l: Record<string, unknown>) => sum + ((l.download_count as number) || 0), 0);
    const activeLinks = links.filter((l: Record<string, unknown>) => l.is_active && new Date(l.expires_at as string) > new Date()).length;

    return { totalViews, totalDownloads, totalLinks: links.length, activeLinks, clusters, links };
}
