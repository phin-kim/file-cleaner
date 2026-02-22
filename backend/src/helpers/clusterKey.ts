function clusterKey(cluster: string[]) {
    return cluster
        .map((question) => question.toLowerCase().trim())
        .sort()
        .join('|');
}
export default clusterKey;
