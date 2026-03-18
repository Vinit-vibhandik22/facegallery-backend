export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateString);
}

export function generateToken(): string {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
        Math.floor(Math.random() * 16).toString(16)
    );
}

export function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + '...';
}

export function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'ready': return 'var(--color-success)';
        case 'processing': return 'var(--color-warning)';
        case 'uploading': return 'var(--color-info)';
        case 'archived': return 'var(--color-muted)';
        case 'failed': return 'var(--color-danger)';
        default: return 'var(--color-muted)';
    }
}

export function getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.95) return 'Very High';
    if (confidence >= 0.85) return 'High';
    if (confidence >= 0.70) return 'Medium';
    return 'Low';
}

export function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.95) return 'var(--color-success)';
    if (confidence >= 0.85) return 'var(--color-info)';
    if (confidence >= 0.70) return 'var(--color-warning)';
    return 'var(--color-danger)';
}
